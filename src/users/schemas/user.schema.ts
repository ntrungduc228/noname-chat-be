import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
}

@Schema({ _id: false })
export class Provider {
  @Prop()
  providerId: string;

  @Prop()
  name: string;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);

@Schema({
  timestamps: true,
})
export class User {
  _id: mongoose.Schema.Types.ObjectId;
  @Prop({ type: String })
  username: string;
  @Prop({ type: String })
  bio: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String })
  avatar: string;

  @Prop({ default: Role.USER })
  role: Role;

  @Prop({
    type: [{ type: ProviderSchema }],
    default: [],
  })
  providers: Provider[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  blacklist: User[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, default: UserStatus.ACTIVE })
  status: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
