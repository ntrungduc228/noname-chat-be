import { Controller, Get, Req, UseGuards, Res, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { AccessTokenGuard } from './guards';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @Redirect()
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { token } = await this.authService.googleLogin(req);
    return { url: `http://localhost:3000/redirect?token=${token}` };
  }

  @Get('info')
  @UseGuards(AccessTokenGuard)
  async getProfile(@Req() req) {
    const user = await this.userService.getProfile(req.user.id);
    return { user: user, message: 'ok' };
  }
}
