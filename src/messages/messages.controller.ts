import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccessTokenGuard } from 'src/auth/guards';
import { CreateRoomDto } from 'src/rooms/dto/create-room.dto';
import { RoomsService } from 'src/rooms/rooms.service';
import { CreateMessage } from './dto/create-message.dto';
import { PaginationMessageDto } from './dto/pagination-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@Body() createMessage: CreateMessage, @Req() req) {
    let newMessage;
    if (createMessage.isNotTemp) {
      if (
        !(await this.roomsService.checkUserIsInRoom(
          req.user.id,
          createMessage.message.room.toString(),
        ))
      )
        throw new HttpException("can't create message", 400);
      newMessage = await this.messagesService.create(
        createMessage.message,
        req.user.id,
      );
    } else {
      const roomCreate: CreateRoomDto = {
        isGroup: false,
        participants: [req.user.id, createMessage.message.room],
      };
      const room = await this.roomsService.create(roomCreate, req.user.id);

      newMessage = await this.messagesService.create(
        { ...createMessage.message, room: room._id },
        req.user.id,
      );
    }

    this.eventEmitter.emit('message.create', newMessage);
    return newMessage;
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  async remove(@Param('id') id: string, @Req() req) {
    const messageRemove = await this.messagesService.remove(id, req.user.id);
    this.eventEmitter.emit('message.delete', messageRemove);
    return 'success';
  }

  @Get(':roomId')
  @UseGuards(AccessTokenGuard)
  async getAllMessage(
    @Param('roomId') roomId: string,
    @Query() { cursor, limit }: PaginationMessageDto,
    @Req() req,
  ) {
    if (await this.roomsService.checkUserIsInRoom(req.user.id, roomId)) {
      return await this.messagesService.findByRoomId(roomId, cursor, limit);
    }
    throw new HttpException("can't get messages from this room", 400);
  }
}
