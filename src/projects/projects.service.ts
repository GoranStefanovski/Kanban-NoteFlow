import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { Group, GroupDocument } from '../schemas/group.schema';
import { Note, NoteDocument } from '../schemas/note.schema';
import { PublicUser, PublicUserDocument } from '../schemas/public-user.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(PublicUser.name) private publicUserModel: Model<PublicUserDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: JwtPayload) {
    const project = await this.projectModel.create({
      ...createProjectDto,
      createdBy: user.role === 'admin' ? 'admin' : user.username,
    });
    return project;
  }

  async findAll(user: JwtPayload) {
    if (user.role === 'admin') {
      return this.projectModel.find().sort({ createdAt: -1 });
    }

    // For public users, return only projects they have access to
    const projectIds = user.permissions?.map((p) => p.projectId) || [];
    return this.projectModel
      .find({ _id: { $in: projectIds } })
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const project = await this.projectModel.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectModel.findByIdAndUpdate(
      id,
      updateProjectDto,
      { new: true },
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async remove(id: string) {
    // Cascade delete: Remove all groups and notes in this project
    const groups = await this.groupModel.find({ projectId: id });
    const groupIds = groups.map((g) => g._id);

    // Delete all notes in these groups
    await this.noteModel.deleteMany({ groupId: { $in: groupIds } });

    // Delete all groups in this project
    await this.groupModel.deleteMany({ projectId: id });

    // Delete the project
    const project = await this.projectModel.findByIdAndDelete(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return { message: 'Project deleted successfully' };
  }

  async getProjectUsers(projectId: string) {
    // Verify project exists
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get all public users with access to this project
    const publicUsers = await this.publicUserModel.find({
      'projectPermissions.projectId': projectId,
    });

    // Return admin + public users
    const users = [
      {
        id: 'admin',
        name: 'Admin',
        role: 'admin',
      },
      ...publicUsers.map((u) => ({
        id: u._id.toString(),
        name: u.username,
        role: 'public',
      })),
    ];

    return { users };
  }
}

