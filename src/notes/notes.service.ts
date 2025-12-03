import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note, NoteDocument } from '../schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { MoveNoteDto } from './dto/move-note.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Group, GroupDocument } from '../schemas/group.schema';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createNoteDto: CreateNoteDto, user: JwtPayload) {
    const note = await this.noteModel.create({
      ...createNoteDto,
      createdBy: user.role === 'admin' ? 'admin' : user.username,
    });

    // Get group to find projectId
    const group = await this.groupModel.findById(note.groupId);
    if (group) {
      await this.activityLogService.logActivity({
        projectId: group.projectId,
        userId: user.sub,
        userRole: user.role,
        userName: user.role === 'admin' ? 'Admin' : (user.username || 'Unknown User'),
        action: 'created',
        entityType: 'note',
        entityId: note._id.toString(),
        entityName: note.title,
        details: { groupId: note.groupId },
      });
    }

    return note;
  }

  async findByGroup(groupId: string) {
    return this.noteModel.find({ groupId }).sort({ order: 1 });
  }

  async findOne(id: string) {
    const note = await this.noteModel.findById(id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, user: JwtPayload) {
    const note = await this.noteModel.findByIdAndUpdate(id, updateNoteDto, {
      new: true,
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Get group to find projectId
    const group = await this.groupModel.findById(note.groupId);
    if (group) {
      await this.activityLogService.logActivity({
        projectId: group.projectId,
        userId: user.sub,
        userRole: user.role,
        userName: user.role === 'admin' ? 'Admin' : (user.username || 'Unknown User'),
        action: 'updated',
        entityType: 'note',
        entityId: note._id.toString(),
        entityName: note.title,
        details: { changes: Object.keys(updateNoteDto) },
      });
    }

    return note;
  }

  async move(id: string, moveNoteDto: MoveNoteDto, user: JwtPayload) {
    const note = await this.noteModel.findById(id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const oldGroupId = note.groupId;
    const { newGroupId, newOrder } = moveNoteDto;
    const noteTitle = note.title;

    // If moving to the same group, just update order
    if (oldGroupId.toString() === newGroupId) {
      // Reorder notes in the same group
      if (note.order < newOrder) {
        // Moving down: decrease order of notes between old and new position
        await this.noteModel.updateMany(
          {
            groupId: oldGroupId,
            order: { $gt: note.order, $lte: newOrder },
          },
          { $inc: { order: -1 } },
        );
      } else if (note.order > newOrder) {
        // Moving up: increase order of notes between new and old position
        await this.noteModel.updateMany(
          {
            groupId: oldGroupId,
            order: { $gte: newOrder, $lt: note.order },
          },
          { $inc: { order: 1 } },
        );
      }
    } else {
      // Moving to different group
      // Decrease order of notes after the old position in old group
      await this.noteModel.updateMany(
        {
          groupId: oldGroupId,
          order: { $gt: note.order },
        },
        { $inc: { order: -1 } },
      );

      // Increase order of notes at or after new position in new group
      await this.noteModel.updateMany(
        {
          groupId: newGroupId,
          order: { $gte: newOrder },
        },
        { $inc: { order: 1 } },
      );
    }

    // Update the note with new group and order
    note.groupId = newGroupId;
    note.order = newOrder;
    await note.save();

    // Log activity
    const group = await this.groupModel.findById(newGroupId);
    if (group) {
      await this.activityLogService.logActivity({
        projectId: group.projectId,
        userId: user.sub,
        userRole: user.role,
        userName: user.role === 'admin' ? 'Admin' : (user.username || 'Unknown User'),
        action: 'moved',
        entityType: 'note',
        entityId: note._id.toString(),
        entityName: noteTitle,
        details: { from: oldGroupId, to: newGroupId },
      });
    }

    return note;
  }

  async remove(id: string, user: JwtPayload) {
    const note = await this.noteModel.findById(id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const noteTitle = note.title;
    const groupId = note.groupId;

    // Get group to find projectId before deleting
    const group = await this.groupModel.findById(groupId);

    await this.noteModel.findByIdAndDelete(id);

    // Reorder remaining notes in the group
    await this.noteModel.updateMany(
      {
        groupId: groupId,
        order: { $gt: note.order },
      },
      { $inc: { order: -1 } },
    );

    // Log activity
    if (group) {
      await this.activityLogService.logActivity({
        projectId: group.projectId,
        userId: user.sub,
        userRole: user.role,
        userName: user.role === 'admin' ? 'Admin' : (user.username || 'Unknown User'),
        action: 'deleted',
        entityType: 'note',
        entityId: id,
        entityName: noteTitle,
        details: { groupId },
      });
    }

    return { message: 'Note deleted successfully' };
  }
}

