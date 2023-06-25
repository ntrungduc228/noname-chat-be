import { UsersService } from './../users/users.service';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, ObjectId } from 'mongoose';
import { CreateRoomDto } from './dto/create-room.dto';
import {
  UpdateGroupDto,
  UpdateMembersDto,
  UpdateRoomDto,
} from './dto/update-room.dto';
import { Room } from './schemas/room.schema';
import { generateAvatar } from 'src/utils/generate-avatar';
import { User } from 'src/users/schemas/user.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    private readonly userService: UsersService,
  ) {}

  async create(
    createRoomDto: CreateRoomDto,
    creatorId: ObjectId,
    allowReturnExisting = false,
  ): Promise<Room> {
    const { participants, isGroup } = createRoomDto;

    try {
      // if (!participants) {
      //   throw new HttpException('Participants are required', 400);
      // }

      if (!participants.includes(creatorId)) {
        participants.unshift(creatorId);
      }

      if (isGroup) {
        if (participants.length < 3) {
          throw new HttpException(
            'Group must have at least 3 participants',
            400,
          );
        }
        if (!createRoomDto.name) {
          throw new HttpException('Group must have a name', 400);
        }
        if (!createRoomDto.avatar) {
          createRoomDto.avatar = generateAvatar(createRoomDto.name);
        }
      } else {
        if (participants.length > 2) {
          throw new HttpException('Chat must have at most 2 participants', 400);
        }
        const existingRoom = await this.findByParticipants(participants);
        console.log(existingRoom);
        if (existingRoom) {
          if (allowReturnExisting) {
            return existingRoom;
          }
          throw new HttpException('Room already exists', 400);
        }
      }

      const createRoom = new this.roomModel(
        Object.assign(createRoomDto, { admin: creatorId, participants }),
      );

      const newRoom = (await createRoom.save()).populate(
        'participants',
        '-password -providers -createdAt -updatedAt -__v',
      );
      return newRoom;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  findAll() {
    return `This action returns all rooms`;
  }

  async findOne(id: string) {
    try {
      const room = await this.roomModel
        .findById(id)
        .populate(
          'participants',
          '-password -providers -createdAt -updatedAt -__v',
        );
      if (!room) {
        console.log('room not found');
        throw new HttpException('Room not found', 404);
      }
      return room;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getByIdAndParticipantId(
    id: string | ObjectId,
    userId: string,
  ): Promise<Room> {
    try {
      const room = await this.roomModel
        .findOne({
          _id: id,
          participants: userId,
        })
        .populate(
          'participants',
          '-password -providers -createdAt -updatedAt -__v',
        );
      if (!room) {
        throw new HttpException('Room not found', 404);
      }
      return room;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findByParticipantId(participantId: string): Promise<Room[]> {
    try {
      const rooms = await this.roomModel
        .find({
          participants: participantId,
        })
        .populate(
          'participants',
          '-password -providers -createdAt -updatedAt -__v',
        );
      return rooms;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    if (!Object.keys(updateGroupDto).length) {
      throw new HttpException('At least one param to update group', 400);
    }

    const room = await this.findOne(id);
    if (room.participants.length < 3) {
      throw new HttpException(
        'Only group chat can be change name or avatar',
        400,
      );
    }

    const updateRoom = Object.assign(room, updateGroupDto);
    return await updateRoom.save();
  }

  async checkPermissionChangeMembers(id: string, userId: string) {
    const room = await this.findOne(id);

    if (!room.isGroup) {
      throw new HttpException('Only add members to a group chat', 400);
    }

    if (room.admin._id.toString() != userId) {
      throw new HttpException('You doesnt permission to do this', 400);
    }
    return room;
  }

  async addMembers(
    id: string,
    userId: string,
    updateMembersDto: UpdateMembersDto,
  ) {
    const room = await this.checkPermissionChangeMembers(id, userId);

    const checkMemberValid = [];
    let memberExists;
    updateMembersDto.participants.forEach((member: ObjectId) => {
      checkMemberValid.push(this.userService.findOneActive(member.toString()));
      memberExists = room.participants.find((user: User) => user._id == member);
      if (memberExists) {
        throw new HttpException(
          `${memberExists?.username} is already exists in group`,
          400,
        );
      }
    });

    await Promise.all(checkMemberValid);

    const updateRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        { $push: { participants: { $each: updateMembersDto.participants } } },
        { new: true },
      )
      .populate(
        'participants',
        '-password -providers -createdAt -updatedAt -__v',
      );
    return updateRoom;
  }

  async removeMember(id: string, userId: string, memberId: string) {
    const roomPromise = this.checkPermissionChangeMembers(id, userId);
    const userRemovePromise = this.userService.findOne(memberId);

    const [room] = await Promise.all([roomPromise, userRemovePromise]);
    const checkUserIsExist = room.participants.some(
      (member: User) => member._id.toString() == memberId,
    );
    if (!checkUserIsExist) {
      throw new HttpException(`User ${memberId} is not exist in group`, 400);
    }

    const updateRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          $pull: {
            participants: memberId,
          },
        },
        { new: true },
      )
      .populate(
        'participants',
        '-password -providers -createdAt -updatedAt -__v',
      );

    return updateRoom;
  }

  async outGroup(id: string, userId: string) {
    // const room = await this.getByIdAndParticipantId(id, userId);
    const room = await this.roomModel.findOne({
      _id: id,
      participants: { $in: [userId] },
    });

    if (!room) {
      throw new HttpException(`User is not in group`, 400);
    }

    if (!room.isGroup) {
      throw new HttpException(`Can not out this group`, 400);
    }

    const criteria: any = {
      $pull: {
        participants: userId,
      },
    };

    if (room.admin._id.toString() == userId && room.participants.length > 1) {
      criteria.$set = {
        admin: room.participants[1],
      };
    }

    const updateRoom = await this.roomModel
      .findByIdAndUpdate(id, criteria, { new: true })
      .populate(
        'participants',
        '-password -providers -createdAt -updatedAt -__v',
      );
    return updateRoom;
  }

  async checkRoomExistsByParticipants(
    participants: ObjectId[],
  ): Promise<boolean> {
    return (await this.findByParticipants(participants)) ? true : false;
  }

  async findByParticipants(participants: ObjectId[]): Promise<Room> {
    return await this.roomModel.findOne({
      participants: participants,
    });
  }

  async getCursorPaginated(
    limit = 10,
    cursor: string = new Date().toISOString(),
    userId: string,
  ): Promise<{
    rooms: Room[];
    endCursor: Date | null;
    hasNextPage: boolean;
  }> {
    try {
      const query = {
        newMessageAt: {
          $lt: cursor,
        },
        participants: userId,
      };

      const rooms = await this.roomModel
        .find(query)
        .sort({ newMessageAt: -1 })
        .limit(limit)
        .populate(
          'participants',
          '-password -providers -createdAt -updatedAt -__v',
        )
        .populate('lastMessage');
      return {
        rooms,
        endCursor: rooms?.[rooms.length - 1]?.newMessageAt || null,
        hasNextPage: rooms.length === limit,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
