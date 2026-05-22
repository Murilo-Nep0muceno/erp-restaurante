import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { CreateUserDto } from '../dto/createuser.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}
  async execute(data: CreateUserDto, role: Role) {
    const existingUser = await this.userRepository.findByUserName(
      data.userName,
    );

    if (existingUser) {
      throw new BadRequestException('Username já existe');
    }

    const hashedPassword = await bcrypt.hash(data.passWord, 10);

    return this.userRepository.createUser({
      userName: data.userName,
      passWord: hashedPassword,
      role,
      name: data.name ?? null,
    });
  }
}
