import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublicUser, PublicUserDocument } from '../schemas/public-user.schema';
import { CreatePublicUserDto } from './dto/create-public-user.dto';
import { UpdatePublicUserDto } from './dto/update-public-user.dto';

@Injectable()
export class PublicUsersService {
  constructor(
    @InjectModel(PublicUser.name)
    private publicUserModel: Model<PublicUserDocument>,
  ) {}

  async create(createPublicUserDto: CreatePublicUserDto) {
    // Check if username already exists (case-insensitive)
    const existingUser = await this.publicUserModel.findOne({
      username: { $regex: new RegExp(`^${createPublicUserDto.username}$`, 'i') },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const user = await this.publicUserModel.create(createPublicUserDto);
    return user;
  }

  async findAll() {
    return this.publicUserModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const user = await this.publicUserModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updatePublicUserDto: UpdatePublicUserDto) {
    // If updating username, check it doesn't already exist (case-insensitive)
    if (updatePublicUserDto.username) {
      const existingUser = await this.publicUserModel.findOne({
        username: { $regex: new RegExp(`^${updatePublicUserDto.username}$`, 'i') },
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    const user = await this.publicUserModel.findByIdAndUpdate(
      id,
      updatePublicUserDto,
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async remove(id: string) {
    const user = await this.publicUserModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }
}

