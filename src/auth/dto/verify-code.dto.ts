import { IsString, Length, MinLength } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

