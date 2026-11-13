import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Departamento } from './entities/departamento.entity';
import { Puesto } from './entities/puesto.entity';
import { Empleado } from './entities/empleado.entity';
import { Turno } from './entities/turno.entity';
import { Contrato } from './entities/contrato.entity';
import { CentroCosto } from '../contabilidad/entities/centro-costo.entity';
import { Usuarios } from '../usuarios/entities/usuario.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Departamento)
    private readonly deptoRepository: Repository<Departamento>,
    @InjectRepository(Puesto)
    private readonly puestoRepository: Repository<Puesto>,
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    private readonly dataSource: DataSource,
    private readonly uploadsService: UploadsService,
  ) {}

  async crearEmpleado(dto: CreateEmpleadoDto) {
    try {
      const existe = await this.empleadoRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (existe)
        throw new BadRequestException(
          `El empleado con código ${dto.codigo} ya existe`,
        );

      const depto = await this.deptoRepository.findOne({
        where: { publicId: dto.departamentoId },
      });
      if (!depto)
        throw new BadRequestException(
          `El departamento ${dto.departamentoId} no existe`,
        );

      const puesto = await this.puestoRepository.findOne({
        where: { publicId: dto.puestoId },
      });
      if (!puesto)
        throw new BadRequestException(`El puesto ${dto.puestoId} no existe`);

      let turnoIdResolved: number | undefined = undefined;

      if (dto.turnoId !== undefined && dto.turnoId !== null) {
        const turno = await this.turnoRepository.findOne({
          where: { publicId: dto.turnoId, activo: true },
        });
        if (!turno)
          throw new BadRequestException(
            `El turno ${dto.turnoId} no existe o está inactivo`,
          );

        turnoIdResolved = turno.id;
      }

      const {
        departamentoId,
        puestoId,
        turnoId,
        usuarioId,
        centroCostoId,
        tipoContrato,
        fechaInicioContrato,
        fechaFinContrato,
        salarioContrato,
        fechaNacimiento,
        fechaIngreso,
        ...restoDto
      } = dto;

      let centroCostoIdResolved: number | null = null;
      if (centroCostoId) {
        const centro = await this.dataSource
          .getRepository(CentroCosto)
          .findOne({ where: { publicId: centroCostoId, activo: true } });
        if (!centro) {
          throw new BadRequestException(
            `El centro de costo ${centroCostoId} no existe o está inactivo`,
          );
        }
        centroCostoIdResolved = centro.id;
      }

      let usuarioIdResolved: number | undefined = undefined;
      if (usuarioId) {
        const usuario = await this.dataSource
          .getRepository(Usuarios)
          .findOne({ where: { publicId: usuarioId } });
        if (!usuario)
          throw new BadRequestException(`El usuario ${usuarioId} no existe`);
        usuarioIdResolved = usuario.id;
      }

      return await this.dataSource.transaction(async (manager) => {
        const empleadoRepo = manager.getRepository(Empleado);
        const contratoRepo = manager.getRepository(Contrato);

        const data = empleadoRepo.create({
          ...restoDto,
          salario: salarioContrato,
          fechaNacimiento: fechaNacimiento
            ? (fechaNacimiento as unknown as Date)
            : undefined,
          fechaIngreso: fechaIngreso as unknown as Date,
          departamentoId: depto.id,
          puestoId: puesto.id,
          turnoId: turnoIdResolved,
          centroCostoId: centroCostoIdResolved,
          usuarioId: usuarioIdResolved,
        });

        const empleado = await empleadoRepo.save(data);

        await contratoRepo.save(
          contratoRepo.create({
            empleadoId: empleado.id,
            tipo: tipoContrato,
            fechaInicio: fechaInicioContrato as unknown as Date,
            fechaFin: fechaFinContrato
              ? (fechaFinContrato as unknown as Date)
              : undefined,
            salario: salarioContrato,
            activo: true,
          }),
        );

        return empleado;
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarEmpleados() {
    return await this.empleadoRepository.find({
      relations: {
        departamento: true,
        puesto: true,
        turno: true,
        centroCosto: true,
        usuario: true,
      },
      order: { id: 'DESC' },
    });
  }

  async paginarEmpleados(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) {
      where.nombre = ILike(`%${buscar}%`);
    }
    const data = await this.empleadoRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        departamento: true,
        puesto: true,
        turno: true,
        centroCosto: true,
        usuario: true,
      },
      order: { id: 'DESC' },
    });
    const total = await this.empleadoRepository.count({ where });
    return { total, data };
  }

  async buscarEmpleadoPorId(publicId: string) {
    const item = await this.empleadoRepository.findOne({
      where: { publicId },
      relations: {
        departamento: true,
        puesto: true,
        turno: true,
        centroCosto: true,
        usuario: true,
        contratos: true,
      },
    });
    if (!item)
      throw new BadRequestException(`El empleado ${publicId} no existe`);
    return item;
  }

  async buscarEmpleadosPorDepartamento(departamentoId: string) {
    const departamento = await this.deptoRepository.findOne({
      where: { publicId: departamentoId },
    });
    if (!departamento)
      throw new BadRequestException(
        `El departamento ${departamentoId} no existe`,
      );

    return await this.empleadoRepository.find({
      where: { departamentoId: departamento.id },
      relations: {
        departamento: true,
        puesto: true,
        turno: true,
        centroCosto: true,
        usuario: true,
      },
      order: { id: 'DESC' },
    });
  }

  async actualizarEmpleado(publicId: string, dto: UpdateEmpleadoDto) {
    const item = await this.empleadoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El empleado ${publicId} no existe`);

    if (dto.codigo) {
      const dup = await this.empleadoRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (dup && dup.id !== item.id)
        throw new BadRequestException(`El código ${dto.codigo} ya está en uso`);
    }

    const {
      departamentoId,
      puestoId,
      turnoId,
      usuarioId,
      centroCostoId,
      ...restoDto
    } = dto;
    const updateData: any = { ...restoDto };

    if (departamentoId) {
      const depto = await this.deptoRepository.findOne({
        where: { publicId: departamentoId },
      });
      if (!depto)
        throw new BadRequestException(
          `El departamento ${departamentoId} no existe`,
        );
      updateData.departamentoId = depto.id;
    }

    if (puestoId) {
      const puesto = await this.puestoRepository.findOne({
        where: { publicId: puestoId },
      });
      if (!puesto)
        throw new BadRequestException(`El puesto ${puestoId} no existe`);
      updateData.puestoId = puesto.id;
    }

    if (turnoId !== undefined) {
      if (turnoId === null) {
        updateData.turnoId = null;
      } else {
        const turno = await this.turnoRepository.findOne({
          where: { publicId: turnoId, activo: true },
        });
        if (!turno)
          throw new BadRequestException(
            `El turno ${turnoId} no existe o está inactivo`,
          );
        updateData.turnoId = turno.id;
      }
    }

    if (centroCostoId !== undefined) {
      if (centroCostoId === null) {
        updateData.centroCostoId = null;
      } else {
        const centro = await this.dataSource
          .getRepository(CentroCosto)
          .findOne({ where: { publicId: centroCostoId, activo: true } });
        if (!centro) {
          throw new BadRequestException(
            `El centro de costo ${centroCostoId} no existe o está inactivo`,
          );
        }
        updateData.centroCostoId = centro.id;
      }
    }

    if (dto.fechaNacimiento)
      updateData.fechaNacimiento = dto.fechaNacimiento;
    if (dto.fechaIngreso) updateData.fechaIngreso = dto.fechaIngreso;

    if (usuarioId !== undefined) {
      if (usuarioId === null) {
        updateData.usuarioId = null;
      } else {
        const usuario = await this.dataSource
          .getRepository(Usuarios)
          .findOne({ where: { publicId: usuarioId } });
        if (!usuario)
          throw new BadRequestException(`El usuario ${usuarioId} no existe`);
        updateData.usuarioId = usuario.id;
      }
    }

    await this.empleadoRepository.update(item.id, updateData);
    this.eliminarFotoAnterior(item.foto, dto.foto);

    return { msg: 'Empleado actualizado exitosamente' };
  }

  /**
   * Borra la foto anterior solo si se reemplazó por una nueva gestionada
   * por /uploads. Nunca debe romper la respuesta; es mejor esfuerzo.
   */
  private eliminarFotoAnterior(fotoAnterior?: string, fotoNueva?: string) {
    if (
      fotoAnterior &&
      fotoAnterior.startsWith('/uploads/') &&
      fotoNueva &&
      fotoNueva !== fotoAnterior
    ) {
      try {
        this.uploadsService.eliminarImagen(fotoAnterior);
      } catch {
        // Mejor esfuerzo.
      }
    }
  }

  async activarDesactivarEmpleado(publicId: string) {
    const item = await this.empleadoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El empleado ${publicId} no existe`);
    await this.empleadoRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Empleado ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
