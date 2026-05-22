import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, Supplier } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SupplierRepository {
  constructor(private prisma: PrismaService) {}
  async createSupplier(data: Prisma.SupplierCreateInput): Promise<Supplier> {
    try {
      const supplier = await this.prisma.supplier.create({
        data,
      });
      return supplier;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro inesperado');
    }
  }

  async findByName(name: string): Promise<Supplier | null> {
    try {
      const supplier = await this.prisma.supplier.findFirst({
        where: { name },
      });
      return supplier;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro inesperado');
    }
  }
  async findAll(): Promise<Supplier[]> {
    return await this.prisma.supplier.findMany();
  }

  async findById(id: string): Promise<Supplier | null> {
    return await this.prisma.supplier.findUnique({
      where: { id_supplier: id },
    });
  }

  async findByCnpj(cnpj: string): Promise<Supplier | null> {
    return await this.prisma.supplier.findUnique({
      where: { cnpj },
    });
  }

  async delete(id: string): Promise<Supplier | null> {
    return await this.prisma.supplier.delete({
      where: { id_supplier: id },
    });
  }

  async update(
    id: string,
    data: Prisma.SupplierUpdateInput,
  ): Promise<Supplier | null> {
    return await this.prisma.supplier.update({
      where: { id_supplier: id },
      data,
    });
  }
}
