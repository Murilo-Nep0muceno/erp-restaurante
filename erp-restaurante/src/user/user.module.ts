import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { CreateUserUseCase } from './UseCase/createuser.usecase';
import { UserRepository } from './repository/user.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UserController],
  providers: [CreateUserUseCase, UserRepository, PrismaService],
  exports: [UserRepository],
})
export class UserModule {}
