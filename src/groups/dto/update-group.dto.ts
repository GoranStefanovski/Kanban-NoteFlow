import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class UpdateGroupDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  color?: string;
}

