import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  unit_measurement!: string;

  // Stock quantity is derived from purchases on create and preserved on
  // update, so it is optional in the payload.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  current_quantity?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  minimum_quantity!: number;

  // Cost (custo médio) is derived from purchases server-side.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  unit_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  selling_price?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  type?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id_supplier?: string;
}
