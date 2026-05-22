import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class DishItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  unit_measurement!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  id_product!: string;
}
