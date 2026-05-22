import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

interface RequestWithUser extends Request {
  user?: { userName?: string };
}

@ApiTags('Logs')
@Controller('logs')
export class LogController {
  constructor(private logService: LogService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar ação na auditoria' })
  @Post()
  create(@Body() dto: CreateLogDto, @Req() req: RequestWithUser) {
    const user = req.user?.userName ?? 'desconhecido';
    return this.logService.create(user, dto.action);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar histórico de auditoria' })
  @Get()
  list() {
    return this.logService.list();
  }
}
