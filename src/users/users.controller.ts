import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessTokenGuard } from 'src/auth/guards';
import { EventsGateway } from 'src/events/events.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private eventEmitter: EventEmitter2,
    private readonly eventGateway: EventsGateway,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('/search')
  async search(@Req() req) {
    const { q } = req.query;
    const users = await this.usersService.findByUsername(q);
    return {
      data: users,
    };
  }

  //   @Get(':id')
  //   findOne(@Param('id') id: string) {
  //     return this.usersService.findOne(+id);
  //   }

  @Patch()
  @UseGuards(AccessTokenGuard)
  async update(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const { id } = req.user;
    const user = await this.usersService.update(id, updateUserDto);
    return {
      data: user,
    };
  }

  //   @Delete(':id')
  //   remove(@Param('id') id: string) {
  //     return this.usersService.remove(+id);
  //   }
}
