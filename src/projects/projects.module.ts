import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from '../schemas/project.schema';
import { Group, GroupSchema } from '../schemas/group.schema';
import { Note, NoteSchema } from '../schemas/note.schema';
import { PublicUser, PublicUserSchema } from '../schemas/public-user.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Note.name, schema: NoteSchema },
      { name: PublicUser.name, schema: PublicUserSchema },
    ]),
    AuthModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}

