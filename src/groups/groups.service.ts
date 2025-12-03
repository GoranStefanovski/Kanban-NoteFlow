import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from '../schemas/group.schema';
import { Note, NoteDocument } from '../schemas/note.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
  ) {}

  async create(createGroupDto: CreateGroupDto) {
    const group = await this.groupModel.create(createGroupDto);
    return group;
  }

  async findByProject(projectId: string) {
    return this.groupModel.find({ projectId }).sort({ order: 1 });
  }

  async findOne(id: string) {
    const group = await this.groupModel.findById(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    const group = await this.groupModel.findByIdAndUpdate(id, updateGroupDto, {
      new: true,
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async remove(id: string) {
    // Cascade delete: Remove all notes in this group
    await this.noteModel.deleteMany({ groupId: id });

    const group = await this.groupModel.findByIdAndDelete(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return { message: 'Group deleted successfully' };
  }
}

