import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group, GroupSchema } from '../schemas/group.schema';
import { Note, NoteSchema } from '../schemas/note.schema';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard } from '../guards/permissions.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: Note.name, schema: NoteSchema },
    ]),
    AuthModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, PermissionsGuard],
})
export class GroupsModule {}

