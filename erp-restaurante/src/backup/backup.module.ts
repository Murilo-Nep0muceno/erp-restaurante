import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BackupController],
  providers: [BackupService, PrismaService],
})
export class BackupModule {}
