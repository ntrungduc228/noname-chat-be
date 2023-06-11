import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AccessTokenGuard } from 'src/auth/guards';

@Controller('api/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@Body() createRoomDto: CreateRoomDto, @Req() req) {
    const room = await this.roomsService.create(createRoomDto, req.user.id);
    return {
      data: room,
    };
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  async getCursorPaginated(@Req() req) {
    const { limit, cursor } = req.query;
    const user = req.user;
    const { rooms, endCursor, hasNextPage } =
      await this.roomsService.getCursorPaginated(+limit, cursor, user.id);
    return {
      data: rooms,
      pageInfo: {
        endCursor,
        hasNextPage,
      },
    };
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  async findOne(@Param('id') id: string, @Req() req) {
    const room = await this.roomsService.getByIdAndParticipantId(
      id,
      req.user.id,
    );
    return {
      data: room,
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(+id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}
