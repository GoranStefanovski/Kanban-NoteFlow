import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '../guards/permissions.guard';

export const RequirePermission = (permission: PermissionType) =>
  SetMetadata('permission', permission);

