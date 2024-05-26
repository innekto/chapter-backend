import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';
import { passMessage, passwordRegexp } from 'src/helpers';

export class AuthResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @Matches(passwordRegexp, {
    message: passMessage,
  })
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  hash: string;
}
