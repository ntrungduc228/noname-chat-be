import { Call, CallSchema } from './schemas/call.schema';

import { CallController } from './call.controller';
import { CallService } from './call.service';
import { MessagesModule } from 'src/messages/messages.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsModule } from 'src/rooms/rooms.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
    RoomsModule,
    UsersModule,
    MessagesModule,
  ],
  controllers: [CallController],
  providers: [CallService],
})
export class CallModule {}
