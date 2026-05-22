import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MoveTableDto {
  @IsInt()
  @Min(1)
  @ApiProperty()
  from: number;

  @IsInt()
  @Min(1)
  @ApiProperty()
  to: number;
}
