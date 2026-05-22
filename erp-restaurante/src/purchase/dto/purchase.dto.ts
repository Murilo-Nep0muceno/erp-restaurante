import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Unit } from '../domain/converter.unit.measurement';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseItemDto {
  @IsNotEmpty({ message: 'O campo nome do item é obrigatório' })
  @IsString()
  @ApiProperty()
  name!: string;

  @IsNotEmpty({ message: 'O campo preço unitário é obrigatório' })
  @IsNumber()
  @ApiProperty()
  unit_price!: number;

  @IsNotEmpty({ message: 'O campo quantidade é obrigatório' })
  @IsNumber()
  @ApiProperty()
  quantity!: number;

  @IsNotEmpty({ message: 'O campo unidade de medida é obrigatório' })
  @IsString()
  @ApiProperty()
  unit_measurement!: Unit;
}

export class PurchaseDto {
  @ApiProperty({
    type: () => PurchaseItemDto,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];

  @IsNotEmpty({ message: 'O campo data é obrigatório' })
  @IsString()
  @ApiProperty()
  date!: string;

  @IsNotEmpty({ message: 'O campo fornecedor é obrigatório' })
  @IsString()
  @ApiProperty()
  id_supplier!: string;
}
