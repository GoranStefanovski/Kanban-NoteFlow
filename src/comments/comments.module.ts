import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment, CommentSchema } from '../schemas/comment.schema';
import { Note, NoteSchema } from '../schemas/note.schema';
import { Group, GroupSchema } from '../schemas/group.schema';
import { AuthModule } from '../auth/auth.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Note.name, schema: NoteSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
    AuthModule,
    ActivityLogModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}

