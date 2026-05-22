import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { SupplierRepository } from '../repository/supplier.repository';
import { SupplierDto } from '../dto/supplier.dto';
import { Supplier } from '@prisma/client';
@Injectable()
export class SupplierUseCase {
  constructor(private SupplierRepository: SupplierRepository) {}

  private async validateSupplierCnpjAndName(
    name: string,
    cnpj: string,
    excludeId?: string,
  ) {
    const nameSupplier = name.trim().toLowerCase();
    const supplierExists =
      await this.SupplierRepository.findByName(nameSupplier);

    if (supplierExists && supplierExists.id_supplier !== excludeId)
      throw new ConflictException('Fornecedor já existe');

    const cnpjExists = await this.SupplierRepository.findByCnpj(cnpj);
    if (cnpjExists && cnpjExists.id_supplier !== excludeId)
      throw new ConflictException('CNPJ já cadastrado');
  }

  async execute(data: SupplierDto): Promise<Supplier> {
    await this.validateSupplierCnpjAndName(data.name, data.cnpj);
    return this.SupplierRepository.createSupplier({
      name: data.name.trim().toLowerCase(),
      cnpj: data.cnpj,
      phone: data.phone,
      email: data.email,
    });
  }
  async getAll(): Promise<Supplier[]> {
    return this.SupplierRepository.findAll();
  }
  async findById(id: string): Promise<Supplier> {
    const supplierById = await this.SupplierRepository.findById(id);
    if (!supplierById) {
      throw new HttpException(
        'Fornecedor não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    return supplierById;
  }

  async delete(id: string): Promise<Supplier | null> {
    const supplierById = await this.SupplierRepository.findById(id);
    if (!supplierById) throw new ConflictException('Fornecedor não encontrado');

    return this.SupplierRepository.delete(id);
  }

  async update(id: string, data: SupplierDto): Promise<Supplier | null> {
    await this.validateSupplierCnpjAndName(data.name, data.cnpj, id);
    const updateSupplier = await this.SupplierRepository.update(id, {
      name: data.name.trim().toLowerCase(),
      cnpj: data.cnpj,
      phone: data.phone,
      email: data.email,
    });

    if (!updateSupplier) {
      throw new HttpException(
        'Erro ao atualizar fornecedor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return updateSupplier;
  }
}
