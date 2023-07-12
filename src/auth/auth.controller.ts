import { Controller, Get, Req, UseGuards, Res, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { AccessTokenGuard } from './guards';
import { UsersService } from 'src/users/users.service';
import { UserStatus } from 'src/users/schemas/user.schema';

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
    const { token, user } = await this.authService.googleLogin(req);
    if (user.status === UserStatus.BANNED) {
      return {
        url: `${process.env.CLIENT_URI}/redirect?error=${encodeURIComponent(
          'your account has been banned',
        )}`,
      };
    }
    return { url: `${process.env.CLIENT_URI}/redirect?token=${token}` };
  }

  @Get('info')
  @UseGuards(AccessTokenGuard)
  async getProfile(@Req() req) {
    const user = await this.userService.getProfile(req.user.id);
    return { user: user, message: 'ok' };
  }
}
