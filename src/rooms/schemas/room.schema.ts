import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Message } from 'src/messages/schemas/message.schema';
import { User } from 'src/users/schemas/user.schema';

export type RoomDocument = HydratedDocument<Room>;

@Schema({
  timestamps: true,
})
export class Room {
  _id: mongoose.Schema.Types.ObjectId;
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  participants: User[];

  @Prop({ type: Boolean, default: false })
  isGroup: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  admin: User;

  @Prop({ type: String })
  avatar: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
  lastMessage: Message;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: Date.now })
  newMessageAt: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
