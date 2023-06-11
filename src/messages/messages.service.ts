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

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const createMessage = new this.messageModel(createMessageDto);
    return await createMessage.save();
  }

  async createCall({
    room,
    sender,
    call,
  }: {
    room: ObjectId;
    sender: ObjectId;
    call: ObjectId;
  }): Promise<Message> {
    const createMessage = new this.messageModel({
      room,
      sender,
      call,
      type: MessageType.CALL,
    });
    return (await createMessage.save()).populate([
      {
        path: 'sender',
        select: 'name avatar',
      },
      {
        path: 'call',
      },
      {
        path: 'room',
        populate: {
          path: 'participants',
          select: 'name avatar',
        },
      },
    ]);
  }

  async remove(id: string) {
    return await this.messageModel.findByIdAndDelete(id);
  }

  async findByRoomId(roomId: string) {
    return await this.messageModel.find({ room: roomId });
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
      {
        path: 'room',
        populate: {
          path: 'participants',
          select: 'username avatar email',
        },
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
