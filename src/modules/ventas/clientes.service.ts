import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  async crearCliente(dto: CreateClienteDto) {
    try {
      const existe = await this.clienteRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (existe)
        throw new BadRequestException(
          `El cliente con código ${dto.codigo} ya existe`,
        );
      const data = this.clienteRepository.create(dto);
      return await this.clienteRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarClientes() {
    return await this.clienteRepository.find({ order: { id: 'DESC' } });
  }

  async paginarClientes(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.nombre = ILike(`%${buscar}%`);
    const data = await this.clienteRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { id: 'DESC' },
    });
    const total = await this.clienteRepository.count({ where });
    return { total, data };
  }

  async buscarClientePorId(publicId: string) {
    const item = await this.clienteRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El cliente ${publicId} no existe`);
    return item;
  }

  async buscarClientesPorTipo(tipo: string) {
    return await this.clienteRepository.find({
      where: { tipo },
      order: { id: 'DESC' },
    });
  }

  async actualizarCliente(publicId: string, dto: UpdateClienteDto) {
    const item = await this.clienteRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El cliente ${publicId} no existe`);
    if (dto.codigo) {
      const dup = await this.clienteRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (dup && dup.id !== item.id)
        throw new BadRequestException(`El código ${dto.codigo} ya está en uso`);
    }
    await this.clienteRepository.update(item.id, dto);
    return { msg: 'Cliente actualizado exitosamente' };
  }

  async activarDesactivarCliente(publicId: string) {
    const item = await this.clienteRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El cliente ${publicId} no existe`);
    await this.clienteRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Cliente ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
