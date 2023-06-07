import { Controller, Get, Req, UseGuards, Res, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { AccessTokenGuard } from './guards';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @Redirect()
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { jwt } = await this.authService.googleLogin(req);
    return { url: `https://www.youtube.com?token=${jwt}` };
  }

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  getProfile(@Req() req) {
    console.log('hi, ', req.user);
    return { user: req.user, message: 'ok' };
  }
}
