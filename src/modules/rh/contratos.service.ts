import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { Contrato } from './entities/contrato.entity';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class ContratosService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
  ) {}

  async crearContrato(dto: CreateContratoDto) {
    try {
      const empleado = await this.empleadoRepository.findOne({
        where: { publicId: dto.empleadoId },
      });
      if (!empleado)
        throw new BadRequestException(
          `El empleado ${dto.empleadoId} no existe`,
        );
      const data = this.contratoRepository.create({
        ...dto,
        empleadoId: empleado.id,
        fechaInicio: dto.fechaInicio as unknown as Date,
        fechaFin: dto.fechaFin
          ? (dto.fechaFin as unknown as Date)
          : undefined,
      });
      const contrato = await this.contratoRepository.save(data);
      await this.sincronizarSalarioEmpleado(contrato.empleadoId);
      return contrato;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarContratos() {
    return await this.contratoRepository.find({
      relations: { empleado: true },
      order: { id: 'DESC' },
    });
  }

  async paginarContratos(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.tipo = ILike(`%${buscar}%`);
    const data = await this.contratoRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        empleado: true,
      },
      order: { id: 'DESC' },
    });
    const total = await this.contratoRepository.count({ where });
    return { total, data };
  }

  async buscarContratoPorId(publicId: string) {
    const item = await this.contratoRepository.findOne({
      where: { publicId },
      relations: {
        empleado: {
          departamento: true,
          puesto: true,
        },
      },
    });
    if (!item)
      throw new BadRequestException(`El contrato ${publicId} no existe`);
    return item;
  }

  async buscarContratosPorEmpleado(publicId: string) {
    const empleado = await this.empleadoRepository.findOne({
      where: { publicId },
    });
    if (!empleado)
      throw new BadRequestException(`El empleado ${publicId} no existe`);
    return await this.contratoRepository.find({
      where: { empleadoId: empleado.id },
      relations: {
        empleado: true,
      },
      order: { id: 'DESC' },
    });
  }

  async actualizarContrato(publicId: string, dto: UpdateContratoDto) {
    const item = await this.contratoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El contrato ${publicId} no existe`);
    const { empleadoId, fechaInicio, fechaFin, ...resto } = dto;
    const updateData: any = { ...resto };
    if (empleadoId) {
      const empleado = await this.empleadoRepository.findOne({
        where: { publicId: empleadoId },
      });
      if (!empleado)
        throw new BadRequestException(`El empleado ${empleadoId} no existe`);
      updateData.empleadoId = empleado.id;
    }
    if (fechaInicio) updateData.fechaInicio = fechaInicio;
    if (fechaFin) updateData.fechaFin = fechaFin;
    await this.contratoRepository.update(item.id, updateData);
    await this.sincronizarSalarioEmpleado(item.empleadoId);
    return { msg: 'Contrato actualizado exitosamente' };
  }

  async activarDesactivarContrato(publicId: string) {
    const item = await this.contratoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El contrato ${publicId} no existe`);
    await this.contratoRepository.update(item.id, { activo: !item.activo });
    await this.sincronizarSalarioEmpleado(item.empleadoId);
    return {
      msg: `Contrato ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }

  /**
   * El salario del empleado depende de su contrato activo más reciente.
   */
  private async sincronizarSalarioEmpleado(empleadoId: number) {
    const contrato = await this.contratoRepository.findOne({
      where: { empleadoId, activo: true },
      order: { fechaInicio: 'DESC', id: 'DESC' },
    });
    if (!contrato) return;
    const salario = Number(contrato.salario);
    if (!Number.isFinite(salario)) return;
    await this.empleadoRepository.update(empleadoId, { salario });
  }
}
