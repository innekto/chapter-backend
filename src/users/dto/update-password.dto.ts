import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { passwordRegexp, passMessage } from 'src/helpers';

export class UpdatePasswordDto {
  @ApiProperty({ example: '1111111' })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: '1111111' })
  @MaxLength(30)
  @Matches(passwordRegexp, {
    message: passMessage,
  })
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({ example: '1111111' })
  @MaxLength(30)
  @Matches(passwordRegexp, {
    message: passMessage,
  })
  @IsNotEmpty()
  repeatNewPassword: string;
}
