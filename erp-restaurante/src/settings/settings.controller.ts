import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Nome do restaurante (público, sem login)' })
  @Get('public')
  getPublic() {
    return this.settingsService.getPublic();
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter configurações globais' })
  @Get()
  get() {
    return this.settingsService.get();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar configurações globais' })
  @Put()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
