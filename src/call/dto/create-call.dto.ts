import { IsNotEmpty } from 'class-validator';
import { Schema } from 'mongoose';

export class CreateCallDto {
  @IsNotEmpty({ message: 'room Id is required' })
  readonly roomId: Schema.Types.ObjectId;
}
