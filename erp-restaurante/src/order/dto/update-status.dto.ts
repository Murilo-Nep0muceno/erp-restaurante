import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const ORDER_STATUSES = ['new', 'cooking', 'ready', 'delivered'] as const;

export class UpdateStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];
}
