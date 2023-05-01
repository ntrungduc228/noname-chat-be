import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Room } from 'src/rooms/schemas/room.schema';
import { User } from 'src/users/schemas/user.schema';

export type CallDocument = HydratedDocument<Call>;

@Schema({
  timestamps: true,
})
export class Call {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  caller: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room' })
  room: Room;
}

export const CallSchema = SchemaFactory.createForClass(Call);
