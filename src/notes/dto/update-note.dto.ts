import { IsString, IsOptional, IsNumber, MinLength, IsDateString, ValidateIf } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

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

