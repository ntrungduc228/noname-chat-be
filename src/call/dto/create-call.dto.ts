import { Schema } from 'mongoose';

export class CreateCallDto {
  readonly caller: Schema.Types.ObjectId;
  readonly room: Schema.Types.ObjectId;
}
