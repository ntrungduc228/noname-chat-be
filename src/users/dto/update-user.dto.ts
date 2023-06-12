import { CreateUserDto } from './create-user.dto';
import { MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  readonly username?: string;
  readonly avatar?: string;
  @MaxLength(70, { message: 'Bio is too long' })
  readonly bio?: string;
}
