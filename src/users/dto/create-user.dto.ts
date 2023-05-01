import { Schema } from 'mongoose';

export class ProviderDto {
  readonly providerId: string;
  readonly name: string;
}

export class CreateUserDto {
  readonly username: string;
  readonly email: string;
  readonly avatar: string;
  readonly providers: ProviderDto[];
  readonly blacklist: Schema.Types.ObjectId[];
}
