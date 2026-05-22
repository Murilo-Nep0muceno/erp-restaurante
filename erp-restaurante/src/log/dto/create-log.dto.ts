import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLogDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  action!: string;
}
