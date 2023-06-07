import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async googleLogin(req) {
    if (!req.user) {
      // return 'No user from google';
    }
    const user = await this.getOrCreateUser(req);
    const jwt = await this.jwtService.signAsync({ id: user.id });
    return {
      message: 'User information from google',
      user: req.user,
      // userCreate: user,
      token: jwt,
    };
  }

  async getOrCreateUser(req) {
    let user = await this.userModel.findOne({ email: req.user.email });
    if (!user) {
      user = await this.userModel.create({
        email: req.user.email,
        username: req.user.username,
        avatar: req.user.picture,
        providers: [
          {
            providerId: req.user.id,
            name: 'google',
          },
        ],
      });
    }
    return user;
  }
}
