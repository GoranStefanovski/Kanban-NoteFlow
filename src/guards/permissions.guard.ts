import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Group, GroupDocument } from '../schemas/group.schema';

export type PermissionType = 'read' | 'write';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<PermissionType>(
      'permission',
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Admin has all permissions
    if (user.role === 'admin') {
      return true;
    }

    // Check if public user has the required permission for the project
    let projectId = request.params.projectId || request.body.projectId;

    // If projectId not found but we have a groupId, fetch the group to get projectId
    if (!projectId && request.params.id) {
      const group = await this.groupModel.findById(request.params.id);
      if (group) {
        projectId = group.projectId;
      }
    }

    if (!projectId) {
      throw new ForbiddenException('Project ID required');
    }

    // Convert projectId to string for comparison (handles ObjectId vs string)
    const projectIdStr = projectId.toString();

    const permission = user.permissions?.find(
      (p) => p.projectId === projectIdStr,
    );

    if (!permission) {
      throw new ForbiddenException('No access to this project');
    }

    if (requiredPermission === 'write' && !permission.canWrite) {
      throw new ForbiddenException('Write permission required');
    }

    if (requiredPermission === 'read' && !permission.canRead) {
      throw new ForbiddenException('Read permission required');
    }

    return true;
  }
}

