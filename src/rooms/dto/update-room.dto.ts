import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { Schema } from 'mongoose';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}

export class UpdateGroupDto {
  @IsOptional()
  @IsString({ message: 'Avatar must be a string' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  readonly name?: string;
}

export class UpdateMembersDto {
  @IsNotEmpty({ message: 'Participants array is required' })
  @IsArray({ message: 'Participants must be an array' })
  @IsMongoId({
    each: true,
    message: '$property must be a valid Array ObjectId',
  })
  readonly participants: Schema.Types.ObjectId[];
}

export class RemoveMemberDto {
  @IsNotEmpty({ message: 'UserId is required' })
  @IsMongoId({
    message: '$property must be a valid  ObjectId',
  })
  readonly memberId: string;
}
