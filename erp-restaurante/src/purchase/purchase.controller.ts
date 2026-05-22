import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PurchaseUseCase } from './UseCase/purchase.usecase';

import { PurchaseDto } from './dto/purchase.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('purchase')
@Controller('purchase')
export class PurchaseController {
  constructor(private purchaseUseCase: PurchaseUseCase) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar Purchase' })
  @ApiResponse({ status: 200, description: 'Purchase criada com sucesso' })
  async create(@Body() body: PurchaseDto) {
    return this.purchaseUseCase.execute(body);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as Purchases' })
  @ApiResponse({ status: 200, description: 'Lista de Purchases' })
  async getAll() {
    return this.purchaseUseCase.getAllPurchases();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar Purchase por ID' })
  @ApiResponse({ status: 200, description: 'Purchase encontrada' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.purchaseUseCase.getById(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar Purchase por ID' })
  @ApiResponse({ status: 200, description: 'Purchase deletada com sucesso' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.purchaseUseCase.delete(id);
  }
}
