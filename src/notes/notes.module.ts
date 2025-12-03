import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Note, NoteSchema } from '../schemas/note.schema';
import { Group, GroupSchema } from '../schemas/group.schema';
import { AuthModule } from '../auth/auth.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
    AuthModule,
    ActivityLogModule,
  ],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}

