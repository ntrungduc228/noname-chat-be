import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesController } from './messages.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
