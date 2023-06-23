import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccessTokenGuard } from 'src/auth/guards';

@Controller('api/messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@Body() createMessageDto: CreateMessageDto, @Req() req) {
    const newMessage = await this.messagesService.create(
      createMessageDto,
      req.user.id,
    );
    this.eventEmitter.emit('message.create', newMessage);
    return newMessage;
  }

  @Post('/test')
  @UseGuards(AccessTokenGuard)
  async testMessage(@Body() createMessageDto: CreateMessageDto, @Req() req) {
    console.log('userid ', req.user.id);
    // goi server message
    this.eventEmitter.emit('message.new', {
      userId: 'userId',
      roomId: createMessageDto.room,
      message: createMessageDto.content,
    });

    this.eventEmitter.emit('message.test', {
      roomId: createMessageDto.room,
      message: createMessageDto.content,
    });
    return { message: 'send message successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const messageRemove = await this.messagesService.remove(id);
    this.eventEmitter.emit('message.delete', messageRemove);
    return 'success';
  }

  @Get(':roomId')
  async get(@Param('roomId') roomId: string) {
    return await this.messagesService.findByRoomId(roomId);
  }
}
