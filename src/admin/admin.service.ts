import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserStatus } from 'src/users/schemas/user.schema';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async getUsers(
    limit: number,
    page: number,
  ): Promise<{
    users: User[];
    limit: number;
    page?: number;
    total?: number;
    totalPages?: number;
  }> {
    const users = await this.userModel
      .find()
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const total = await this.userModel.countDocuments();
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      limit,
      page,
      total,
      totalPages,
    };
  }
  async lockUser(id: string) {
    return await this.userModel.findByIdAndUpdate(
      id,
      {
        status: UserStatus.BANNED,
      },
      { new: true },
    );
  }
  async unlockUser(id: string) {
    return await this.userModel.findByIdAndUpdate(
      id,
      {
        status: UserStatus.ACTIVE,
      },
      { new: true },
    );
  }
}
