import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'O nome de usuário é obrigatório' })
  @IsString()
  @ApiProperty()
  userName!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/(?=.*[a-z])/, { message: 'Deve ter letra minúscula' })
  @Matches(/(?=.*[A-Z])/, { message: 'Deve ter letra maiúscula' })
  @Matches(/(?=.*\d)/, { message: 'Deve ter número' })
  @Matches(/(?=.*[@$!%*?&])/, { message: 'Deve ter caractere especial' })
  passWord!: string;
}
