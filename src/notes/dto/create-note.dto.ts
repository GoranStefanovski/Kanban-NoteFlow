import { IsString, IsOptional, IsNumber, MinLength, IsDateString, ValidateIf } from 'class-validator';

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

  @ValidateIf((o) => o.assigneeId !== null)
  @IsString()
  @IsOptional()
  assigneeId?: string | null;

  @ValidateIf((o) => o.assigneeName !== null)
  @IsString()
  @IsOptional()
  assigneeName?: string | null;

  @ValidateIf((o) => o.dueDate !== null)
  @IsDateString()
  @IsOptional()
  dueDate?: Date | null;
}

