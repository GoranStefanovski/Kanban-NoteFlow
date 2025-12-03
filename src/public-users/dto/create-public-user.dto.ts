import { IsString, IsEmail, IsArray, IsOptional, MinLength } from 'class-validator';

export class ProjectPermissionDto {
  @IsString()
  projectId: string;

  @IsOptional()
  canRead?: boolean;

  @IsOptional()
  canWrite?: boolean;
}

export class CreatePublicUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsArray()
  @IsOptional()
  projectPermissions?: ProjectPermissionDto[];
}

