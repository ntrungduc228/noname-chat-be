import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Room } from 'src/rooms/schemas/room.schema';
import { User } from 'src/users/schemas/user.schema';

export type CallDocument = HydratedDocument<Call>;

export enum CallStatus {
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}
@Schema({
  timestamps: true,
})
export class Call {
  _id: mongoose.Schema.Types.ObjectId;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  caller: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room' })
  room: Room;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  acceptedUsers: User[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  rejectedUsers: User[];

  @Prop({ default: CallStatus.ONGOING })
  status: CallStatus;

  @Prop({ type: Date })
  endedAt: Date;
}

export const CallSchema = SchemaFactory.createForClass(Call);
