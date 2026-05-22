import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Login must NOT enforce the password-creation rules (CreateUserDto). Otherwise
// any account whose password doesn't match the current policy could never sign in.
export class LoginDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'O nome de usuário é obrigatório' })
  @IsString()
  userName!: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString()
  passWord!: string;
}
