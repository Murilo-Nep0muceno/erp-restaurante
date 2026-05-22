import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { MoveTableDto } from './dto/move-table.dto';
import { CloseTableDto } from './dto/close-table.dto';
import { OrderUseCase } from './order.usecase';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private OrderUseCase: OrderUseCase) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'GARCOM')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Enviar pedido para a cozinha' })
  @ApiResponse({ status: 201, description: 'Pedido criado' })
  async create(@Body() body: CreateOrderDto) {
    return this.OrderUseCase.create(body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA', 'GARCOM', 'COZINHA')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  async getAll() {
    return this.OrderUseCase.getAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA', 'GARCOM', 'COZINHA')
  @ApiBearerAuth()
  @Get('kitchen')
  @ApiOperation({ summary: 'Estado da cozinha (aberta/fechada)' })
  async getKitchen() {
    return this.OrderUseCase.getKitchen();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'COZINHA')
  @ApiBearerAuth()
  @Post('kitchen/close')
  @ApiOperation({ summary: 'Fechar a cozinha (bloqueia novos pedidos)' })
  async closeKitchen() {
    return this.OrderUseCase.closeKitchen();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'COZINHA')
  @ApiBearerAuth()
  @Post('kitchen/open')
  @ApiOperation({ summary: 'Reabrir a cozinha' })
  async openKitchen() {
    return this.OrderUseCase.openKitchen();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'GARCOM')
  @ApiBearerAuth()
  @Patch('move-table')
  @ApiOperation({ summary: 'Mover/juntar a comanda de uma mesa para outra' })
  async moveTable(@Body() body: MoveTableDto) {
    return this.OrderUseCase.moveTable(body.from, body.to);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'GARCOM')
  @ApiBearerAuth()
  @Patch('close-table')
  @ApiOperation({ summary: 'Fechar/pagar a comanda de uma mesa' })
  async closeTable(@Body() body: CloseTableDto) {
    return this.OrderUseCase.closeTable(body.tableNum);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'COZINHA')
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do pedido (cozinha)' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.OrderUseCase.updateStatus(id, body.status);
  }
}
