import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SupplierDto } from './dto/supplier.dto';
import { SupplierUseCase } from './useCase/supplier.usecase';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Supplier')
@Controller('supplier')
export class SupplierController {
  constructor(private SupplierUseCase: SupplierUseCase) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Criar Supplier' })
  @ApiResponse({ status: 200, description: 'Supplier criado com sucesso' })
  async create(@Body() body: SupplierDto) {
    return this.SupplierUseCase.execute(body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Get('getAll')
  @ApiOperation({ summary: 'Lista todos os Supplier' })
  @ApiResponse({
    status: 200,
    description: 'Lista de Supplier retornada com sucesso',
  })
  async getAll() {
    return this.SupplierUseCase.getAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Busca Supplier por ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier encontrado com sucesso',
  })
  async findById(@Param('id') id: string) {
    return this.SupplierUseCase.findById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Deletar Supplier por ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier deletado com sucesso',
  })
  async delete(@Param('id') id: string) {
    return this.SupplierUseCase.delete(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar Supplier por ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier atualizado com sucesso',
  })
  async update(@Param('id') id: string, @Body() body: SupplierDto) {
    return this.SupplierUseCase.update(id, body);
  }
}
