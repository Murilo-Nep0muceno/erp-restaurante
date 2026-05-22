import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CloseTableDto {
  @IsInt()
  @Min(1)
  @ApiProperty()
  tableNum: number;
}
