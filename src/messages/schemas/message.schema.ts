import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Call } from 'src/call/schemas/call.schema';
import { Room } from 'src/rooms/schemas/room.schema';
import { User } from 'src/users/schemas/user.schema';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  CALL = 'CALL',
}

@Schema({
  timestamps: true,
})
export class Message {
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  seenders: User[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  usersDelete: User[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  sender: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room' })
  room: Room;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String, index: true })
  type: MessageType;

  @Prop({ type: Array, default: [] })
  images: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Call' })
  call: Call;

  @Prop({ type: Array, default: [] })
  files: string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
