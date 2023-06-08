import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const createMessage = new this.messageModel(createMessageDto);
    return await createMessage.save();
  }

  async remove(id: string) {
    return await this.messageModel.findByIdAndDelete(id);
  }
}
