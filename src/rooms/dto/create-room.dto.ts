import { Schema } from 'mongoose';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsArray,
  IsMongoId,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
export class CreateRoomDto {
  @IsNotEmpty({ message: 'Participants is required' })
  @IsArray({ message: 'Participants must be an array' })
  @IsMongoId({
    each: true,
    message: '$property must be a valid Array ObjectId',
  })
  readonly participants: Schema.Types.ObjectId[];

  @IsNotEmpty({ message: 'Boolean value is required' })
  @IsBoolean({ message: 'Invalid boolean value' })
  readonly isGroup: boolean;

  @IsOptional()
  @IsMongoId({
    message: 'admin must be a valid ObjectId',
  })
  readonly admin?: Schema.Types.ObjectId;

  @IsOptional()
  @IsString({ message: 'Avatar must be a string' })
  avatar?: string;

  @IsString({ message: 'Group must have a string name' })
  @ValidateIf((object) => object.isGroup)
  readonly name?: string;
}
