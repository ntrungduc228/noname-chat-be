import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PopulateOptions } from 'mongoose';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, MessageType } from './schemas/message.schema';
import { RoomsService } from 'src/rooms/rooms.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly roomService: RoomsService,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    sender: string,
  ): Promise<Message> {
    const createMessage = new this.messageModel({
      ...createMessageDto,
      sender,
    });
    return await createMessage.save();
  }

  async createCall({
    roomId,
    senderId,
    callId,
  }: {
    roomId: ObjectId;
    senderId: ObjectId;
    callId: ObjectId;
  }): Promise<Message> {
    const createMessage = new this.messageModel({
      room: roomId,
      sender: senderId,
      call: callId,
      type: MessageType.CALL,
    });
    return (await createMessage.save()).populate([
      {
        path: 'sender',
        select: 'name avatar',
      },
      {
        path: 'call',
        populate: [
          {
            path: 'caller',
            select: 'username avatar email',
          },
          {
            path: 'acceptedUsers',
            select: 'username avatar email',
          },
          {
            path: 'rejectedUsers',
            select: 'username avatar email',
          },
          {
            path: 'room',
            populate: {
              path: 'participants',
              select: 'username avatar email',
            },
          },
        ],
      },
    ]);
  }

  async remove(id: string) {
    return await this.messageModel.findByIdAndDelete(id);
  }

  async findByRoomId(roomId: string) {
    return await this.messageModel
      .find({ room: roomId })
      .populate('sender', 'avatar username');
  }
  async findByTypeAndParticipantId(
    type: MessageType,
    participantId: string,
  ): Promise<Message[]> {
    const populates: PopulateOptions[] = [
      {
        path: 'sender',
        select: 'username avatar email',
      },
    ];
    switch (type) {
      case MessageType.CALL:
        populates.push({
          path: 'call',
          populate: [
            {
              path: 'caller',
              select: 'username avatar email',
            },
            {
              path: 'acceptedUsers',
              select: 'username avatar email',
            },
            {
              path: 'rejectedUsers',
              select: 'username avatar email',
            },
            {
              path: 'room',
              select: 'name participants avatar isGroup',
              populate: {
                path: 'participants',
                select: 'username avatar email',
              },
            },
          ],
        });
        break;
      default:
        break;
    }

    const rooms = await this.roomService.findByParticipantId(participantId);

    return await this.messageModel
      .find({
        type,
        room: rooms.map((room) => room._id),
      })
      .populate(populates);
  }
}
