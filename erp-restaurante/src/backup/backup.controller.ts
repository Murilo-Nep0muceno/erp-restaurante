import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BackupService, type BackupData } from './backup.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

@ApiTags('Backup')
@Controller('backup')
@UseGuards(AuthGuard, RolesGuard)
@Roles('GERENTE')
@ApiBearerAuth()
export class BackupController {
  constructor(private backupService: BackupService) {}

  @ApiOperation({ summary: 'Exportar todo o sistema (dump JSON)' })
  @Get()
  export() {
    return this.backupService.export();
  }

  @ApiOperation({ summary: 'Restaurar o sistema a partir de um backup' })
  @Post('restore')
  restore(@Body() body: BackupData) {
    return this.backupService.restore(body);
  }

  @ApiOperation({ summary: 'Zerar dados do mês (compras, movimentos e logs)' })
  @Post('reset')
  reset() {
    return this.backupService.reset();
  }
}
