import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  projectId: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  color?: string;
}

