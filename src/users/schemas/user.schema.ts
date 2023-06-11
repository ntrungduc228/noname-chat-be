import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
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
}

export const UserSchema = SchemaFactory.createForClass(User);
