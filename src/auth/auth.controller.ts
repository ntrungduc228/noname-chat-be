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
    const { token } = await this.authService.googleLogin(req);
    return { url: `http://localhost:3000/redirect?token=${token}` };
  }

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  getProfile(@Req() req) {
    console.log('hi, ', req.user);
    return { user: req.user, message: 'ok' };
  }
}
