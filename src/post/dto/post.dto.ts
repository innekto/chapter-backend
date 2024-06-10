import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { unifiedRegexp } from 'src/helpers';

export class PostDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty()
  readonly imgUrl?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty()
  @Matches(unifiedRegexp)
  readonly caption?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty()
  @Matches(unifiedRegexp)
  readonly title?: string;

  @ValidateIf((value) => !value.imageUrl && !value.caption && !value.title)
  @IsNotEmpty({
    message: 'At least one field (imageUrl, caption, title) must be specified',
  })
  readonly atLeastOneField?: string;
}
