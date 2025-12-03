import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

export type PermissionType = 'read' | 'write';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
    const projectId = request.params.projectId || request.body.projectId;

    if (!projectId) {
      throw new ForbiddenException('Project ID required');
    }

    const permission = user.permissions?.find(
      (p) => p.projectId === projectId,
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

