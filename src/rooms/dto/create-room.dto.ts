import { Schema } from 'mongoose';

export class CreateRoomDto {
  readonly participants: Schema.Types.ObjectId[];
  readonly isGroup: boolean;
  readonly admin?: Schema.Types.ObjectId;
  avatar?: string;
  readonly name?: string;
}
