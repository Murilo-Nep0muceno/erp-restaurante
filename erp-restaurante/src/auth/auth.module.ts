import { Module } from '@nestjs/common';
import { LoginUseCase } from './useCases/LoginUseCase';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import 'dotenv/config';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [LoginUseCase],
  controllers: [AuthController],
  exports: [LoginUseCase],
})
export class AuthModule {}
