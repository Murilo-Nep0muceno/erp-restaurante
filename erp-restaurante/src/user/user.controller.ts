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
import { CreateUserDto } from './dto/createuser.dto';
import { UpdateUserDto } from './dto/updateuser.dto';
import { CreateUserUseCase } from './UseCase/createuser.usecase';
import { UserRepository } from './repository/user.repository';
import { Role } from '@prisma/client';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private createUser: CreateUserUseCase,
    private userRepository: UserRepository,
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiOperation({ summary: 'Listar usuários' })
  @ApiResponse({ status: 200, description: 'Lista de usuários' })
  @ApiBearerAuth()
  @Get()
  list() {
    return this.userRepository.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiOperation({ summary: 'Atualizar usuário (nome/perfil)' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @ApiBearerAuth()
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userRepository.update(id, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiOperation({ summary: 'Excluir usuário' })
  @ApiResponse({ status: 200, description: 'Usuário excluído' })
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userRepository.deleteUser(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiOperation({ summary: 'Criar Gerente' })
  @ApiResponse({ status: 200, description: 'Gerente criado com sucesso' })
  @ApiBearerAuth()
  @Post()
  createGerente(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto, Role.GERENTE);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiOperation({ summary: 'Criar Garçom' })
  @ApiResponse({ status: 200, description: 'Garçom criado com sucesso' })
  @ApiBearerAuth()
  @Post('garcom')
  createGarcom(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto, Role.GARCOM);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiOperation({ summary: 'Criar Balconista' })
  @ApiResponse({ status: 200, description: 'Balconista criado com sucesso' })
  @ApiBearerAuth()
  @Post('balconista')
  createBalconista(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto, Role.BALCONISTA);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GERENTE')
  @ApiOperation({ summary: 'Criar Cozinha' })
  @ApiResponse({ status: 200, description: 'Cozinha criado com sucesso' })
  @ApiBearerAuth()
  @Post('cozinha')
  createCozinha(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto, Role.COZINHA);
  }
}
