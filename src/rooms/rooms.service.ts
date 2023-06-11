import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './schemas/room.schema';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

  async create(
    createRoomDto: CreateRoomDto,
    creatorId: ObjectId,
    allowReturnExisting = false,
  ): Promise<Room> {
    const { participants, isGroup } = createRoomDto;

    try {
      if (!participants) {
        throw new HttpException('Participants are required', 400);
      }

      if (!participants.includes(creatorId)) {
        participants.push(creatorId);
      }

      if (isGroup) {
        if (participants.length < 3) {
          throw new HttpException(
            'Group must have at least 3 participants',
            400,
          );
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

  async findOne(id: string) {
    try {
      const room = this.roomModel
        .findById(id)
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

  async getByIdAndParticipantId(id: string | ObjectId, userId: string) {
    try {
      const room = this.roomModel
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
      const rooms = this.roomModel
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

  update(id: number, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }
  async delete(id: string) {
    return `This action removes a #${id} room`;
  }

  remove(id: number) {
    return `This action removes a #${id} room`;
  }

  async checkRoomExistsByParticipants(
    participants: ObjectId[],
  ): Promise<boolean> {
    return (await this.findByParticipants(participants)) ? true : false;
  }

  async findByParticipants(participants: ObjectId[]): Promise<Room> {
    return await this.roomModel.findOne({
      participants: { $all: participants },
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
        );
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
