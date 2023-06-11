import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessagesService } from 'src/messages/messages.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { UsersService } from 'src/users/users.service';
import { CreateCallDto } from './dto/create-call.dto';
import { Call, CallStatus } from './schemas/call.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Message, MessageType } from 'src/messages/schemas/message.schema';

@Injectable()
export class CallService {
  constructor(
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
    private readonly roomService: RoomsService,
    @InjectModel(Call.name) private callModel: Model<Call>,
  ) {}
  async create(createCallDto: CreateCallDto, callerId: string): Promise<Call> {
    const { roomId } = createCallDto;
    const caller = await this.usersService.findOneActive(callerId);
    const room = await this.roomService.getByIdAndParticipantId(
      roomId,
      callerId,
    );

    const createCall = new this.callModel({
      caller: caller._id,
      room: room._id,
      acceptedUsers: [caller._id],
    });

    const newCall = await createCall.save();
    const newMessage = await this.messagesService.createCall({
      room: room._id as any,
      sender: caller._id as any,
      call: newCall._id as any,
    });
    await newCall.populate('acceptedUsers', 'username avatar email');
    return {
      ...newCall.toJSON(),
      caller: caller,
      room: {
        ...room.toJSON(),
        lastMessage: newMessage,
      },
    };
  }

  findAll() {
    return `This action returns all call`;
  }

  async findCall(id: string, reqUserId: string): Promise<Call> {
    try {
      const call = await this.callModel
        .findById(id)
        .populate('acceptedUsers', 'username avatar email')
        .populate('rejectedUsers', 'username avatar email')
        .populate('caller', 'username avatar email')
        .populate({
          path: 'room',
          populate: {
            path: 'participants',
            select: 'username avatar email',
          },
        });
      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }
      if (call.status === CallStatus.ENDED) {
        throw new HttpException('Call ended', HttpStatus.BAD_REQUEST);
      }
      if (!call.room.participants.find((p) => p._id.toString() === reqUserId)) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }
      return call;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async accept(id: string, reqUserId: string): Promise<Call> {
    try {
      const user = await this.usersService.findOneActive(reqUserId);
      const call = await this.findCall(id, reqUserId);
      if (call.acceptedUsers.find((u) => u._id.toString() === reqUserId)) {
        throw new HttpException(
          'User already accepted',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (call.rejectedUsers.find((u) => u._id.toString() === reqUserId)) {
        throw new HttpException(
          'User already rejected',
          HttpStatus.BAD_REQUEST,
        );
      }
      call.acceptedUsers.push(user);
      await this.callModel.updateOne(
        { _id: id },
        { acceptedUsers: call.acceptedUsers },
      );
      return call;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async reject(id: string, reqUserId: string): Promise<Call> {
    try {
      const user = await this.usersService.findOneActive(reqUserId);
      const call = await this.findCall(id, reqUserId);
      if (call.acceptedUsers.find((u) => u._id.toString() === reqUserId)) {
        throw new HttpException(
          'User already accepted',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (call.rejectedUsers.find((u) => u._id.toString() === reqUserId)) {
        throw new HttpException(
          'User already rejected',
          HttpStatus.BAD_REQUEST,
        );
      }
      call.rejectedUsers.push(user);
      await this.callModel.updateOne(
        { _id: id },
        { rejectedUsers: call.rejectedUsers },
      );
      return call;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async end(id: string, reqUserId: string): Promise<Call> {
    try {
      const call = await this.findCall(id, reqUserId);
      await this.callModel.updateOne(
        { _id: id },
        {
          endedAt: new Date().toISOString(),
          status: CallStatus.ENDED,
        },
      );
      return call;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findHistory(reqUserId: string): Promise<Message[]> {
    try {
      const messages = await this.messagesService.findByTypeAndParticipantId(
        MessageType.CALL,
        reqUserId,
      );
      return messages;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // update(id: number, updateCallDto: UpdateCallDto) {
  //   return `This action updates a #${id} call`;
  // }

  remove(id: number) {
    return `This action removes a #${id} call`;
  }
}
