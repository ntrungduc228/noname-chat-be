import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';
import { Req, UseGuards, Res, Redirect } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards';

@Controller('api/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@Body() createMessageDto: CreateMessageDto, @Req() req) {
    return await this.messagesService.create(createMessageDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.messagesService.remove(id);
    return 'success';
  }

  @Get(':roomId')
  async get(@Param('roomId') roomId: string) {
    return await this.messagesService.findByRoomId(roomId);
  }
}
