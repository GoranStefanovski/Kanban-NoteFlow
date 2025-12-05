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
    // Get the note before updating to compare changes
    const oldNote = await this.noteModel.findById(id);
    if (!oldNote) {
      throw new NotFoundException('Note not found');
    }

    // Handle null values by explicitly unsetting fields
    const updateOperations: any = { $set: {} };
    
    Object.keys(updateNoteDto).forEach((key) => {
      const value = updateNoteDto[key];
      if (value === null) {
        // Use $unset to remove the field
        if (!updateOperations.$unset) {
          updateOperations.$unset = {};
        }
        updateOperations.$unset[key] = '';
      } else if (value !== undefined) {
        // Use $set for regular updates
        updateOperations.$set[key] = value;
      }
    });

    // Remove empty $set if no fields to set
    if (Object.keys(updateOperations.$set).length === 0) {
      delete updateOperations.$set;
    }

    const note = await this.noteModel.findByIdAndUpdate(id, updateOperations, {
      new: true,
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Get group to find projectId
    const group = await this.groupModel.findById(note.groupId);
    if (group) {
      const userName = user.role === 'admin' ? 'Admin' : (user.username || 'Unknown User');
      const baseLogParams = {
        projectId: group.projectId,
        userId: user.sub,
        userRole: user.role,
        userName,
        entityType: 'note' as const,
        entityId: note._id.toString(),
        entityName: note.title,
      };

      // Log specific changes for assignee, due date
      const logPromises: Promise<void>[] = [];

      // Check assignee changes
      if ('assigneeId' in updateNoteDto || 'assigneeName' in updateNoteDto) {
        const oldAssignee = oldNote.assigneeName;
        const newAssignee = note.assigneeName;

        if (!oldAssignee && newAssignee) {
          // Assigned to someone new
          logPromises.push(
            this.activityLogService.logActivity({
              ...baseLogParams,
              action: 'assigned note to',
              details: { assigneeTo: newAssignee },
            })
          );
        } else if (oldAssignee && !newAssignee) {
          // Removed assignee
          logPromises.push(
            this.activityLogService.logActivity({
              ...baseLogParams,
              action: 'removed assignee',
              details: { previousAssignee: oldAssignee },
            })
          );
        } else if (oldAssignee && newAssignee && oldAssignee !== newAssignee) {
          // Changed assignee
          logPromises.push(
            this.activityLogService.logActivity({
              ...baseLogParams,
              action: 'changed assignee',
              details: { from: oldAssignee, to: newAssignee },
            })
          );
        }
      }

      // Check due date changes
      if ('dueDate' in updateNoteDto) {
        const oldDueDate = oldNote.dueDate;
        const newDueDate = note.dueDate;

        if (!oldDueDate && newDueDate) {
          // Set due date
          logPromises.push(
            this.activityLogService.logActivity({
              ...baseLogParams,
              action: 'set due date',
              details: { dueDate: newDueDate.toISOString().split('T')[0] },
            })
          );
        } else if (oldDueDate && !newDueDate) {
          // Removed due date
          logPromises.push(
            this.activityLogService.logActivity({
              ...baseLogParams,
              action: 'removed due date',
              details: { previousDueDate: oldDueDate.toISOString().split('T')[0] },
            })
          );
        } else if (oldDueDate && newDueDate && oldDueDate.getTime() !== newDueDate.getTime()) {
          // Changed due date
          logPromises.push(
            this.activityLogService.logActivity({
              ...baseLogParams,
              action: 'changed due date',
              details: { 
                from: oldDueDate.toISOString().split('T')[0], 
                to: newDueDate.toISOString().split('T')[0] 
              },
            })
          );
        }
      }

      // Check for title/content changes
      if (('title' in updateNoteDto && updateNoteDto.title !== oldNote.title) ||
          ('content' in updateNoteDto && updateNoteDto.content !== oldNote.content)) {
        const changes: string[] = [];
        if ('title' in updateNoteDto && updateNoteDto.title !== oldNote.title) {
          changes.push('title');
        }
        if ('content' in updateNoteDto && updateNoteDto.content !== oldNote.content) {
          changes.push('content');
        }
        
        logPromises.push(
          this.activityLogService.logActivity({
            ...baseLogParams,
            action: 'updated note',
            details: { changes },
          })
        );
      }

      // If no specific changes were detected, log a generic update
      if (logPromises.length === 0 && Object.keys(updateNoteDto).length > 0) {
        logPromises.push(
          this.activityLogService.logActivity({
            ...baseLogParams,
            action: 'updated note',
            details: { changes: Object.keys(updateNoteDto) },
          })
        );
      }

      // Execute all log operations
      await Promise.all(logPromises);
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

