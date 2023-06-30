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
import { CallService } from './call.service';
import { CreateCallDto } from './dto/create-call.dto';
import { AccessTokenGuard } from 'src/auth/guards';

@Controller('calls')
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(
    @Body() createCallDto: CreateCallDto,
    @Req() req: { user: any },
  ) {
    const call = await this.callService.create(createCallDto, req.user.id);
    return {
      data: call,
    };
  }

  @Get()
  findAll() {
    return this.callService.findAll();
  }

  @Get('history')
  @UseGuards(AccessTokenGuard)
  async getHistory(@Req() req) {
    const messages = await this.callService.findHistory(req.user.id);
    return {
      data: messages,
    };
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  async findOne(@Param('id') id: string, @Req() req) {
    const call = await this.callService.findCall(id, req.user.id);
    return {
      data: call,
    };
  }

  @Patch(':id/accept')
  @UseGuards(AccessTokenGuard)
  async accept(@Param('id') id: string, @Req() req) {
    await this.callService.accept(id, req.user.id);
    return {
      message: 'Accept call successfully',
    };
  }

  @Patch(':id/reject')
  @UseGuards(AccessTokenGuard)
  async reject(@Param('id') id: string, @Req() req) {
    await this.callService.reject(id, req.user.id);
    return {
      message: 'Reject call successfully',
    };
  }

  @Patch(':id/end')
  @UseGuards(AccessTokenGuard)
  async end(@Param('id') id: string, @Req() req) {
    await this.callService.end(id, req.user.id);
    return {
      message: 'End call successfully',
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.callService.remove(+id);
  }
}
