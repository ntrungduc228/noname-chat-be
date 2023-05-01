import { Module } from '@nestjs/common';
import { CallService } from './call.service';
import { CallController } from './call.controller';
import { Call, CallSchema } from './schemas/call.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
  ],
  controllers: [CallController],
  providers: [CallService],
})
export class CallModule {}
