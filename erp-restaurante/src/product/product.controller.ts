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
import { ProductUseCase } from './useCases/product.usecase';
import { CreateProductDto } from './dto/createproduct.dto';
import { Product } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private ProductUseCase: ProductUseCase) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Criar Product' })
  @ApiResponse({ status: 200, description: 'Product criado com sucesso' })
  async create(@Body() body: CreateProductDto) {
    return this.ProductUseCase.execute(body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Get('pending-purchases')
  @ApiOperation({
    summary: 'Itens comprados ainda não cadastrados no estoque',
  })
  @ApiResponse({ status: 200, description: 'Itens pendentes retornados' })
  async getPendingPurchases() {
    return this.ProductUseCase.getPendingPurchasedItems();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Obter Product por ID' })
  @ApiResponse({ status: 200, description: 'Product encontrado' })
  async findById(@Param('id') id: string) {
    return this.ProductUseCase.getById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar todos os Product' })
  @ApiResponse({
    status: 200,
    description: 'Lista de Product retornada com sucesso',
  })
  async getAll() {
    return this.ProductUseCase.getAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar Product por ID' })
  @ApiResponse({ status: 200, description: 'Product atualizado com sucesso' })
  async update(
    @Param('id') id: string,
    @Body() data: CreateProductDto,
  ): Promise<Product> {
    return this.ProductUseCase.update(id, data);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Deletar Product por ID' })
  @ApiResponse({ status: 200, description: 'Product deletado com sucesso' })
  async delete(@Param('id') id: string): Promise<Product> {
    return this.ProductUseCase.delete(id);
  }
}
