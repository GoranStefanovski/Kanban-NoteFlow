import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import { Note, NoteDocument } from '../schemas/note.schema';
import { Group, GroupDocument } from '../schemas/group.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createCommentDto: CreateCommentDto, user: JwtPayload) {
    const comment = await this.commentModel.create({
      ...createCommentDto,
      authorId: user.sub,
      authorName: user.role === 'admin' ? 'Admin' : user.username,
    });

    // Log activity
    const note = await this.noteModel.findById(createCommentDto.noteId);
    if (note) {
      const group = await this.groupModel.findById(note.groupId);
      if (group) {
        await this.activityLogService.logActivity({
          projectId: group.projectId,
          userId: user.sub,
          userRole: user.role,
          userName: user.role === 'admin' ? 'Admin' : (user.username || 'Unknown User'),
          action: 'created',
          entityType: 'comment',
          entityId: comment._id.toString(),
          entityName: `Comment on "${note.title}"`,
          details: { noteId: note._id.toString(), noteTitle: note.title },
        });
      }
    }

    return comment;
  }

  async findByNote(noteId: string) {
    return this.commentModel.find({ noteId }).sort({ createdAt: 1 });
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, user: JwtPayload) {
    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the author can edit their comment
    if (comment.authorId !== user.sub) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = updateCommentDto.content;
    await comment.save();

    // Log activity
    const note = await this.noteModel.findById(comment.noteId);
    if (note) {
      const group = await this.groupModel.findById(note.groupId);
      if (group) {
        await this.activityLogService.logActivity({
          projectId: group.projectId,
          userId: user.sub,
          userRole: user.role,
          userName: user.role === 'admin' ? 'Admin' : (user.username || 'Unknown User'),
          action: 'updated',
          entityType: 'comment',
          entityId: comment._id.toString(),
          entityName: `Comment on "${note.title}"`,
          details: { noteId: note._id.toString(), noteTitle: note.title },
        });
      }
    }
    
    return comment;
  }

  // Note: No delete method - comments cannot be deleted per requirements
}

