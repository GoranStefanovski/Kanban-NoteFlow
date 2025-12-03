import { IsString, IsNumber } from 'class-validator';

export class MoveNoteDto {
  @IsString()
  newGroupId: string;

  @IsNumber()
  newOrder: number;
}

