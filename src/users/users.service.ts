import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto) {
    const createUser = new this.userModel(createUserDto);
    return createUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findOne({ _id: id });
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return user;
  }

  async findOneActive(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user.isActive) {
      throw new HttpException('User is not active', 400);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User[]> {
    const users = await this.userModel.find({
      username: { $regex: username, $options: 'i' },
    });
    return users;
  }
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return user.save();
  }
}
