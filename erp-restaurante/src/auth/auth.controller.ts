import { Body, Controller, Post } from '@nestjs/common';
import { LoginUseCase } from './useCases/LoginUseCase';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private loginUseCase: LoginUseCase) {}

  @Post('login')
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  login(@Body() body: LoginDto) {
    return this.loginUseCase.signIn(body.userName, body.passWord);
  }
}
