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
    const savedMessage = await createMessage.save();
    await this.roomService.addMessageToRoom(
      createMessageDto.room.toString(),
      savedMessage._id.toString(),
    );
    return savedMessage.populate({
      path: 'sender',
      select: 'username avatar email',
    });
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
    const newMessage = new this.messageModel({
      room: roomId,
      sender: senderId,
      call: callId,
      type: MessageType.CALL,
    });

    const createdMessage = await newMessage.save();

    await this.roomService.addMessageToRoom(
      roomId.toString(),
      createdMessage._id.toString(),
    );

    return await createdMessage.populate([
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

  async findByRoomId(
    roomId: string,
    cursor: string = new Date().toISOString(),
    limit: number,
  ): Promise<{
    data: Message[];
    nextCursor: Date | null;
  }> {
    const data = await this.messageModel
      .find({
        room: roomId,
        createdAt: {
          $lt: cursor,
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'avatar username');

    const nextCursor = data[data.length - 1].createdAt;
    const hasNextPage = await this.messageModel.count({
      room: roomId,
      createdAt: {
        $lt: nextCursor,
      },
    });
    return { data, nextCursor: hasNextPage > 0 ? nextCursor : undefined };
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
      .populate(populates)
      .sort({ createdAt: -1 });
  }
}
