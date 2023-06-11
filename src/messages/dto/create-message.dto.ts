import { MessageType } from '../schemas/message.schema';
import { Schema } from 'mongoose';

export class CreateMessageDto {
  readonly type: MessageType;
  readonly content: string;
  readonly sender: Schema.Types.ObjectId;
  readonly seenders: Schema.Types.ObjectId[];
  readonly room: Schema.Types.ObjectId;
}
