import { IsString, IsOptional, IsNumber, MinLength, IsDateString } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  assigneeName?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: Date;
}

