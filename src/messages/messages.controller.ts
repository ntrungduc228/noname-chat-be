import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('api/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(@Body() createMessageDto: CreateMessageDto) {
    return await this.messagesService.create(createMessageDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.messagesService.remove(id);
    return 'success';
  }
}
