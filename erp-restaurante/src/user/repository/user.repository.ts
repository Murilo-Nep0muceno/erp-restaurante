import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  createUser(data: {
    userName: string;
    passWord: string;
    role: Role;
    name?: string | null;
  }) {
    try {
      return this.prisma.user.create({ data });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Erro ao criar usuário no repositório',
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  findByUserName(userName: string) {
    try {
      return this.prisma.user.findUnique({
        where: { userName },
      });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Erro ao buscar usuário no repositório',
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  // Listagem sem expor a senha.
  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, userName: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  update(id: string, data: { name?: string | null; role?: Role }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, userName: true, name: true, role: true, createdAt: true },
    });
  }

  deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
