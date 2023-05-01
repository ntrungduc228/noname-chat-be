import { Schema } from 'mongoose';

export class CreateRoomDto {
  readonly participant: Schema.Types.ObjectId[];
  readonly isGroup: boolean;
  readonly admin: Schema.Types.ObjectId;
  readonly avatar: string;
  readonly name: string;
}
