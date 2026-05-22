import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.log.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  create(user: string, action: string) {
    return this.prisma.log.create({ data: { user, action } });
  }
}
