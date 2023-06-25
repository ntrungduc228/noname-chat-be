import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from 'src/auth/guards';
import { AdminService } from './admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get('/users')
  @UseGuards(AccessTokenGuard)
  async getUsers(
    @Req()
    req: {
      query: {
        limit: string;
        page: number;
      };
    },
  ) {
    const { limit = 10, page = 1 } = req.query;
    const { users, total, totalPages } = await this.adminService.getUsers(
      +limit,
      +page,
    );
    return {
      data: users,
      pageInfo: {
        limit: +limit,
        total,
        currentPage: +page,
        totalPages,
      },
    };
  }

  @Patch('/users/:id/lock')
  @UseGuards(AccessTokenGuard)
  async lockUser(@Param('id') id: string) {
    const user = await this.adminService.lockUser(id);
    return {
      message: 'Lock user successfully',
      data: user,
    };
  }
  @Patch('/users/:id/unlock')
  async unlockUser(@Param('id') id: string) {
    const user = await this.adminService.unlockUser(id);
    return {
      message: 'Unlock user successfully',
      data: user,
    };
  }
}
