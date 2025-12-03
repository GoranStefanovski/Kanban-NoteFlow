import { IsString, IsOptional, IsNumber, MinLength, IsDateString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  groupId: string;

  @IsNumber()
  @IsOptional()
  order?: number;

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

