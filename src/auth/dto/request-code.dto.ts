import { IsString, MinLength } from 'class-validator';

export class RequestCodeDto {
  @IsString()
  @MinLength(3)
  username: string;
}

