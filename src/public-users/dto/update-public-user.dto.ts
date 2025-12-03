import { IsString, IsEmail, IsArray, IsOptional, MinLength } from 'class-validator';

export class ProjectPermissionDto {
  @IsString()
  projectId: string;

  @IsOptional()
  canRead?: boolean;

  @IsOptional()
  canWrite?: boolean;
}

export class UpdatePublicUserDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsOptional()
  projectPermissions?: ProjectPermissionDto[];
}

