import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  restaurantName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({ required: false })
  tableCount?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  cnpj?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  footerNotice?: string;
}
