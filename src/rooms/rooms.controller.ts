import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import {
  RemoveMemberDto,
  UpdateGroupDto,
  UpdateMembersDto,
} from './dto/update-room.dto';
import { AccessTokenGuard } from 'src/auth/guards';

@Controller('rooms')
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

  @Get('/participants')
  @UseGuards(AccessTokenGuard)
  async findParitipantsByUserId(@Req() req) {
    const { q } = req.query;
    console.log('q  ', q);
    let data;
    if (!q) {
      data = await this.roomsService.findParitipantsByUserId(req.user.id);
    } else {
      data = await this.roomsService.findParticipantsByUsername(req.user.id, q);
    }

    return { data };
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
  @UseGuards(AccessTokenGuard)
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const room = await this.roomsService.update(id, updateGroupDto);
    return { data: room };
  }

  @Patch(':id/members/add')
  @UseGuards(AccessTokenGuard)
  async addMembers(
    @Param('id') id: string,
    @Body() updateMembersDto: UpdateMembersDto,
    @Req() req,
  ) {
    const room = await this.roomsService.addMembers(
      id,
      req.user.id,
      updateMembersDto,
    );
    return { data: room };
  }

  @Patch(':id/members/remove')
  @UseGuards(AccessTokenGuard)
  async removeMember(
    @Param('id') id: string,
    @Body() removeMemberDto: RemoveMemberDto,
    @Req() req,
  ) {
    const room = await this.roomsService.removeMember(
      id,
      req.user.id,
      removeMemberDto.memberId,
    );
    return { data: room };
  }

  @Patch(':id/out')
  @UseGuards(AccessTokenGuard)
  async outGroup(@Param('id') id: string, @Req() req) {
    const room = await this.roomsService.outGroup(id, req.user.id);
    return { data: room };
  }
}
