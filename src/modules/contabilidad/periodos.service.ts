import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { PeriodoContable } from './entities/periodo-contable.entity';
import { CreatePeriodoContableDto } from './dto/create-periodo-contable.dto';
import { UpdatePeriodoContableDto } from './dto/update-periodo-contable.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class PeriodosService {
  constructor(
    @InjectRepository(PeriodoContable)
    private readonly periodoRepository: Repository<PeriodoContable>,
  ) {}

  async crear(dto: CreatePeriodoContableDto) {
    const inicio = this.parseFecha(dto.fechaInicio);
    const fin = this.parseFecha(dto.fechaFin);
    this.validarRango(dto.anio, dto.mes, inicio, fin);

    const existe = await this.periodoRepository.findOne({
      where: { anio: dto.anio, mes: dto.mes },
    });
    if (existe) {
      throw new BadRequestException(
        `El periodo ${dto.anio}-${dto.mes} ya existe`,
      );
    }

    const solapado = await this.periodoRepository.findOne({
      where: {
        fechaInicio: LessThanOrEqual(dto.fechaFin),
        fechaFin: MoreThanOrEqual(dto.fechaInicio),
      },
    });
    if (solapado) {
      throw new BadRequestException(
        `El periodo se traslapa con ${solapado.anio}-${solapado.mes}`,
      );
    }

    const data = this.periodoRepository.create({
      anio: dto.anio,
      mes: dto.mes,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      estatus: 'abierto',
    });
    return this.periodoRepository.save(data);
  }

  async buscar() {
    return this.periodoRepository.find({
      order: { anio: 'DESC', mes: 'DESC' },
    });
  }

  async paginar(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1 } = paginacionDto;
    const [data, total] = await this.periodoRepository.findAndCount({
      take: registros,
      skip: (pagina - 1) * registros,
      order: { anio: 'DESC', mes: 'DESC' },
    });
    return { total, data };
  }

  async buscarPorId(publicId: string) {
    const item = await this.periodoRepository.findOne({
      where: { publicId },
    });
    if (!item) {
      throw new BadRequestException(`El periodo ${publicId} no existe`);
    }
    return item;
  }

  async buscarPorIdInterno(id: number) {
    const item = await this.periodoRepository.findOne({ where: { id } });
    if (!item) {
      throw new BadRequestException(`El periodo ${id} no existe`);
    }
    return item;
  }

  async actualizar(publicId: string, dto: UpdatePeriodoContableDto) {
    const item = await this.buscarPorId(publicId);
    if (item.estatus === 'cerrado') {
      throw new BadRequestException('No se puede modificar un periodo cerrado');
    }

    const anio = dto.anio ?? item.anio;
    const mes = dto.mes ?? item.mes;
    const inicioStr = dto.fechaInicio ?? this.fechaString(item.fechaInicio);
    const finStr = dto.fechaFin ?? this.fechaString(item.fechaFin);
    const inicio = this.parseFecha(inicioStr);
    const fin = this.parseFecha(finStr);
    this.validarRango(anio, mes, inicio, fin);

    const solapado = await this.periodoRepository.findOne({
      where: {
        fechaInicio: LessThanOrEqual(finStr),
        fechaFin: MoreThanOrEqual(inicioStr),
      },
    });
    if (solapado && solapado.id !== item.id) {
      throw new BadRequestException(
        `El periodo se traslapa con ${solapado.anio}-${solapado.mes}`,
      );
    }

    await this.periodoRepository.update(item.id, {
      anio,
      mes,
      fechaInicio: inicioStr,
      fechaFin: finStr,
    });
    return { msg: 'Periodo contable actualizado exitosamente' };
  }

  async cerrar(publicId: string) {
    const item = await this.buscarPorId(publicId);
    if (item.estatus === 'cerrado') {
      throw new BadRequestException('El periodo ya está cerrado');
    }
    await this.periodoRepository.update(item.id, {
      estatus: 'cerrado',
      fechaCierre: new Date(),
    });
    return { msg: 'Periodo contable cerrado exitosamente' };
  }

  async reabrir(publicId: string) {
    const item = await this.buscarPorId(publicId);
    if (item.estatus === 'abierto') {
      throw new BadRequestException('El periodo ya está abierto');
    }
    await this.periodoRepository.update(item.id, {
      estatus: 'abierto',
      fechaCierre: null,
    });
    return { msg: 'Periodo contable reabierto exitosamente' };
  }

  async obtenerPeriodoParaFecha(fecha: string) {
    const periodo = await this.periodoRepository.findOne({
      where: {
        fechaInicio: LessThanOrEqual(fecha),
        fechaFin: MoreThanOrEqual(fecha),
      },
    });
    if (!periodo) {
      throw new BadRequestException(
        'No existe un periodo contable para la fecha indicada',
      );
    }
    if (periodo.estatus !== 'abierto') {
      throw new BadRequestException(
        `El periodo ${periodo.anio}-${periodo.mes} está cerrado`,
      );
    }
    return periodo;
  }

  private validarRango(anio: number, mes: number, inicio: Date, fin: Date) {
    if (inicio > fin) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser posterior a la fecha de fin',
      );
    }
    if (
      inicio.getUTCFullYear() !== anio ||
      inicio.getUTCMonth() + 1 !== mes ||
      fin.getUTCFullYear() !== anio ||
      fin.getUTCMonth() + 1 !== mes
    ) {
      throw new BadRequestException(
        'Las fechas deben pertenecer al año y mes indicados',
      );
    }
    if (inicio.getUTCDate() !== 1) {
      throw new BadRequestException(
        'La fecha de inicio debe ser el primer día del mes',
      );
    }
    const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    if (fin.getUTCDate() !== ultimoDia) {
      throw new BadRequestException(
        'La fecha de fin debe ser el último día del mes',
      );
    }
  }

  private parseFecha(fecha: string) {
    const valor = new Date(`${fecha}T00:00:00.000Z`);
    if (Number.isNaN(valor.getTime())) {
      throw new BadRequestException(`La fecha ${fecha} no es válida`);
    }
    return valor;
  }

  private fechaString(fecha: Date | string) {
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
