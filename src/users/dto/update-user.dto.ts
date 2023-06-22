import { CreateUserDto } from './create-user.dto';
import { MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Schema } from 'mongoose';

export class ProviderDto {
  readonly providerId: string;
  readonly name: string;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
  readonly username: string;
  readonly email: string;
  readonly avatar: string;
  readonly providers: ProviderDto[];
  readonly blacklist: Schema.Types.ObjectId[];
}
