import {
  Controller,
  Get,
  Post,
  Delete,
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from 'src/users/schemas/user.schema';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@Body() createRoomDto: CreateRoomDto, @Req() req) {
    const room = await this.roomsService.create(createRoomDto, req.user.id);

    const dataReturn = {
      admin: room.admin,
      avatar: room.avatar,
      name: room.name,
      _id: room._id,
      lastMessage: room.lastMessage,
    };

    room.participants.forEach((participant: User) => {
      console.log('emit ', participant.username);
      this.eventEmitter.emit('event.listen', {
        userId: participant._id,
        payload: dataReturn,
        type: 'room.created',
      });
    });

    return {
      data: dataReturn,
    };
  }

  @Get('/participants')
  @UseGuards(AccessTokenGuard)
  async findParticipantsByUserId(@Req() req) {
    const { q } = req.query;
    let data;
    if (!q) {
      data = await this.roomsService.findParticipantsByUserId(req.user.id);
    } else {
      data = await this.roomsService.findParticipantsByUsername(req.user.id, q);
    }

    return { data };
  }

  @Get(':id/participants')
  @UseGuards(AccessTokenGuard)
  async findParticipantsByUserIdNotInRoom(@Param('id') id: string, @Req() req) {
    const { q } = req.query;
    if (!id) {
      return null;
    }
    let data;
    if (!q) {
      data = await this.roomsService.findParticipantsByUserIdNotInRoom(
        req.user.id,
        id,
      );
    } else {
      data = await this.roomsService.findParticipantsByUsernameNotInRoom(
        req.user.id,
        q,
        id,
      );
    }

    return { data };
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  async getCursorPaginated(@Req() req) {
    const { limit, cursor, type } = req.query;
    const user = req.user;
    const { rooms, endCursor, hasNextPage } =
      await this.roomsService.getCursorPaginated(+limit, cursor, type, user.id);
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

    const dataReturn = {
      admin: room.admin,
      avatar: room.avatar,
      name: room.name,
      _id: room._id,
      lastMessage: room.lastMessage,
    };

    room.participants.forEach((participant: User) => {
      console.log('emit ', participant.username);
      this.eventEmitter.emit('event.listen', {
        userId: participant._id,
        payload: dataReturn,
        type: 'room.updated',
      });
    });

    this.eventEmitter.emit('room-updated', {
      payload: dataReturn,
      type: 'room.updated',
    });

    return { data: dataReturn };
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

    const dataReturn = {
      admin: room.admin,
      avatar: room.avatar,
      name: room.name,
      _id: room._id,
      lastMessage: room.lastMessage,
    };

    room.participants.forEach((participant: User) => {
      console.log('emit ', participant.username);
      this.eventEmitter.emit('event.listen', {
        userId: participant._id,
        payload: dataReturn,
        type: 'room.added',
      });
    });

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

    this.eventEmitter.emit('event.listen', {
      userId: removeMemberDto.memberId,
      payload: room,
      type: 'room.removed',
    });

    this.eventEmitter.emit('room.removed', {
      userId: removeMemberDto.memberId,
      payload: room,
      type: 'room.removed',
    });

    return { data: room };
  }

  @Patch(':id/out')
  @UseGuards(AccessTokenGuard)
  async outGroup(@Param('id') id: string, @Req() req) {
    const room = await this.roomsService.outGroup(id, req.user.id);

    this.eventEmitter.emit('event.listen', {
      userId: req.user.id,
      payload: room,
      type: 'room.outed',
    });

    this.eventEmitter.emit('room.outed', {
      userId: req.user.id,
      payload: room,
      type: 'room.outed',
    });

    return { data: room };
  }
  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  async remove(@Param('id') id: string, @Req() req) {
    const room = await this.roomsService.deleteRoom(id, req.user.id);
    return { data: room };
  }
  @Get(':id/checkroom')
  @UseGuards(AccessTokenGuard)
  async checkRoom(@Param('id') id: string, @Req() req) {
    const room = await this.roomsService.checkRoom(id, [req.user.id, id]);
    return {
      data: room,
    };
  }
}
