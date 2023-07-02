import { HttpException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { generateAvatar } from 'src/utils/generate-avatar';
import { UsersService } from './../users/users.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateGroupDto, UpdateMembersDto } from './dto/update-room.dto';
import { Room } from './schemas/room.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    private readonly userService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    createRoomDto: CreateRoomDto,
    creatorId: ObjectId,
    allowReturnExisting = false,
  ): Promise<Room> {
    const { participants, isGroup } = createRoomDto;

    try {
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

  async findParticipantsByUserId(userId: string) {
    const user = await this.userService.findOne(userId);
    const rooms = await this.roomModel
      .find({
        participants: { $in: [userId] },
        isGroup: false,
      })
      .populate('participants', 'username avatar');
    const participants = [];
    if (!rooms.length) {
      return [];
    }
    rooms.forEach((room: Room) => {
      const roommate = room.participants.find(
        (participant: User) => participant._id.toString() != userId,
      );

      if (!participants.includes(roommate._id.toString())) {
        participants.push(roommate);
      }
    });

    return participants;
  }

  async findParticipantsByUserIdNotInRoom(userId: string, roomId: string) {
    const user = await this.userService.findOne(userId);
    const rooms = await this.roomModel
      .find({
        participants: { $in: [userId] },
        isGroup: false,
        _id: { $ne: roomId },
      })
      .populate('participants', 'username avatar');
    const participants = [];
    if (!rooms.length) {
      return [];
    }
    rooms.forEach((room: Room) => {
      const roommate = room.participants.find(
        (participant: User) => participant._id.toString() != userId,
      );

      if (!participants.includes(roommate._id.toString())) {
        participants.push(roommate);
      }
    });

    return participants;
  }

  async findParticipantsByUsernameNotInRoom(
    userId: string,
    username: string,
    roomId: string,
  ) {
    const user = await this.userService.findOne(userId);

    const rooms = await this.roomModel.aggregate([
      {
        $lookup: {
          from: 'users',
          let: { participantsIds: '$participants' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$participantsIds'] },
              },
            },
            {
              $project: {
                _id: 1,
                username: 1,
                avatar: 1,
              },
            },
          ],
          as: 'participants',
        },
      },
      {
        $match: {
          isGroup: false,
          // 'participants._id': userId,
          _id: { $ne: roomId },
          'participants.username': { $regex: username, $options: 'i' },
        },
      },
      {
        $project: {
          participants: 1,
        },
      },
    ]);

    const participants = [];
    if (!rooms.length) {
      return [];
    }
    rooms.forEach((room: Room) => {
      if (
        room.participants.some(
          (participant: User) => participant._id.toString() === userId,
        )
      ) {
        const roommate = room.participants.find(
          (participant: User) => participant._id.toString() != userId,
        );

        if (!participants.includes(roommate._id.toString())) {
          participants.push(roommate);
        }
      }
    });

    return participants;
    // return rooms;
  }

  async findParticipantsByUsername(userId: string, username: string) {
    const user = await this.userService.findOne(userId);

    const rooms = await this.roomModel.aggregate([
      {
        $lookup: {
          from: 'users',
          let: { participantsIds: '$participants' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$participantsIds'] },
              },
            },
            {
              $project: {
                _id: 1,
                username: 1,
                avatar: 1,
              },
            },
          ],
          as: 'participants',
        },
      },
      {
        $match: {
          isGroup: false,
          // 'participants._id': userId,

          'participants.username': { $regex: username, $options: 'i' },
        },
      },
      {
        $project: {
          participants: 1,
        },
      },
    ]);

    const participants = [];
    if (!rooms.length) {
      return [];
    }
    rooms.forEach((room: Room) => {
      if (
        room.participants.some(
          (participant: User) => participant._id.toString() === userId,
        )
      ) {
        const roommate = room.participants.find(
          (participant: User) => participant._id.toString() != userId,
        );

        if (!participants.includes(roommate._id.toString())) {
          participants.push(roommate);
        }
      }
    });

    return participants;
    // return rooms;
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
    userId: string | ObjectId,
  ): Promise<Room> {
    try {
      const room = await this.roomModel
        .findOne({
          _id: id,
          participants: { $in: [userId] },
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
    if (!room.isGroup) {
      throw new HttpException(
        'Only group chat can be change name or avatar',
        400,
      );
    }

    const updateRoom = Object.assign(room, updateGroupDto);
    return await updateRoom.save();
  }

  async checkPermissionChangeMembers(id: string, userId: string) {
    const room = await this.getByIdAndParticipantId(id, userId);

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
    type: 'all' | 'direct' | 'group' = 'all',
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
        isDeleted: false,
      };
      if (type === 'direct') {
        query['isGroup'] = false;
      } else if (type === 'group') {
        query['isGroup'] = true;
      }

      const rooms = await this.roomModel
        .find(query)
        .sort({ newMessageAt: -1 })
        .limit(limit)
        .select('name avatar isGroup admin participants newMessageAt')
        .populate('admin', 'username avatar email')
        .populate('participants', 'username avatar email')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'username avatar email',
          },
        });
      return {
        rooms,
        endCursor: rooms?.[rooms.length - 1]?.newMessageAt || null,
        hasNextPage: rooms.length === limit,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async addMessageToRoom(roomId: string, messageId: string): Promise<Room> {
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          $set: {
            lastMessage: messageId,
            newMessageAt: new Date(),
          },
        },
        { new: true },
      )
      .select('name avatar isGroup admin participants newMessageAt')
      .populate('admin', 'username avatar email')
      .populate('participants', 'username avatar email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username avatar email',
        },
      });
    this.eventEmitter.emit('room.update', updatedRoom);
    return updatedRoom;
  }

  async checkRoom(id: string, participants: ObjectId[]): Promise<Room> {
    let room = await this.roomModel.findById(id);
    if (!room) {
      room = await this.roomModel.findOne({
        participants: participants,
      });
    }
    return room;
  }
  async deleteRoom(id: string, userId: string) {
    await this.getByIdAndParticipantId(id, userId);
    const deleteRoom = await this.roomModel.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
        },
      },
      { new: true },
    );
    return deleteRoom;
  }
}
