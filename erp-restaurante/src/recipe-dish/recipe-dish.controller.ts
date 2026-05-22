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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { recipeDishDto } from './dto/recipe-dish.dto';
import { RecipeDishUseCase } from './useCase/recipe-dish.usecase';

@ApiTags('Dish')
@Controller('recipe-dish')
export class RecipeDishController {
  constructor(private RecipeDishUseCase: RecipeDishUseCase) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar prato' })
  @ApiResponse({ status: 200, description: 'Prato criado com sucesso' })
  @Post()
  async create(@Body() body: recipeDishDto) {
    return this.RecipeDishUseCase.create(body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA', 'GARCOM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os pratos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pratos retornada com sucesso',
  })
  @Get()
  async getAll() {
    return this.RecipeDishUseCase.getAll();
  }

  @ApiOperation({ summary: 'Cardápio público (sem login) — pratos disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista pública de pratos' })
  @Get('public')
  async getPublic() {
    return this.RecipeDishUseCase.getPublic();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE', 'BALCONISTA', 'GARCOM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar prato por ID' })
  @ApiResponse({
    status: 200,
    description: 'Prato encontrado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Prato não encontrado' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.RecipeDishUseCase.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: recipeDishDto) {
    return this.RecipeDishUseCase.update(id, body);
  }
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.RecipeDishUseCase.delete(id);
  }
}
