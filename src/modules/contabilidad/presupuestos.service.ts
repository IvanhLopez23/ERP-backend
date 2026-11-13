import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PresupuestoCentroCosto } from './entities/presupuesto-centro-costo.entity';
import { CentrosCostoService } from './centros-costo.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import {
  CrearPresupuestosBulkDto,
  PresupuestosQueryDto,
  UpdatePresupuestoDto,
} from './dto/update-presupuesto.dto';

@Injectable()
export class PresupuestosService {
  constructor(
    @InjectRepository(PresupuestoCentroCosto)
    private readonly presupuestoRepository: Repository<PresupuestoCentroCosto>,
    private readonly centrosCostoService: CentrosCostoService,
  ) {}

  async crear(dto: CreatePresupuestoDto, usuarioId: number) {
    const centro = await this.resolverCentro(dto.centroCostoId);
    const existente = await this.presupuestoRepository.findOne({
      where: {
        anio: dto.anio,
        mes: dto.mes,
        centroCostoId: centro,
      },
    });
    if (existente) {
      throw new BadRequestException(
        `Ya existe un presupuesto para ${dto.anio}-${String(dto.mes).padStart(2, '0')} y el centro indicado`,
      );
    }

    return this.presupuestoRepository.save(
      this.presupuestoRepository.create({
        anio: dto.anio,
        mes: dto.mes,
        centroCostoId: centro,
        ingresosPresupuestados: this.redondear2(
          dto.ingresosPresupuestados ?? 0,
        ),
        gastosPresupuestados: this.redondear2(dto.gastosPresupuestados ?? 0),
        notas: dto.notas ?? null,
        usuarioId,
      }),
    );
  }

  async crearBulk(dto: CrearPresupuestosBulkDto, usuarioId: number) {
    const entidades: Array<{
      anio: number;
      mes: number;
      centroCostoId: number;
      ingresosPresupuestados: number;
      gastosPresupuestados: number;
      notas: string | null;
      usuarioId: number;
    }> = [];

    for (const item of dto.presupuestos) {
      const centroCostoId = await this.resolverCentro(item.centroCostoId);
      entidades.push({
        anio: item.anio,
        mes: item.mes,
        centroCostoId,
        ingresosPresupuestados: this.redondear2(
          item.ingresosPresupuestados ?? 0,
        ),
        gastosPresupuestados: this.redondear2(item.gastosPresupuestados ?? 0),
        notas: item.notas ?? null,
        usuarioId,
      });
    }

    await this.presupuestoRepository.upsert(entidades, [
      'anio',
      'mes',
      'centroCostoId',
    ]);

    return {
      msg: 'Presupuestos guardados exitosamente',
      total: entidades.length,
    };
  }

  async buscar(query: PresupuestosQueryDto) {
    const where: FindOptionsWhere<PresupuestoCentroCosto> = {};
    if (query.anio) where.anio = query.anio;
    if (query.centroCostoId) {
      const centro = await this.centrosCostoService.buscarPorId(
        query.centroCostoId,
      );
      where.centroCostoId = centro.id;
    }

    return this.presupuestoRepository.find({
      where,
      relations: { centroCosto: true },
      order: { anio: 'DESC', mes: 'ASC' },
    });
  }

  async buscarPorId(publicId: string) {
    const item = await this.presupuestoRepository.findOne({
      where: { publicId },
      relations: { centroCosto: true },
    });
    if (!item) {
      throw new BadRequestException(`El presupuesto ${publicId} no existe`);
    }
    return item;
  }

  async actualizar(publicId: string, dto: UpdatePresupuestoDto) {
    const item = await this.buscarPorId(publicId);
    const centroCostoId = dto.centroCostoId
      ? await this.resolverCentro(dto.centroCostoId)
      : item.centroCostoId;
    const anio = dto.anio ?? item.anio;
    const mes = dto.mes ?? item.mes;

    const duplicado = await this.presupuestoRepository.findOne({
      where: { anio, mes, centroCostoId },
    });
    if (duplicado && duplicado.id !== item.id) {
      throw new BadRequestException(
        `Ya existe un presupuesto para ${anio}-${String(mes).padStart(2, '0')} y el centro indicado`,
      );
    }

    await this.presupuestoRepository.update(item.id, {
      anio,
      mes,
      centroCostoId,
      ingresosPresupuestados:
        dto.ingresosPresupuestados !== undefined
          ? this.redondear2(dto.ingresosPresupuestados)
          : item.ingresosPresupuestados,
      gastosPresupuestados:
        dto.gastosPresupuestados !== undefined
          ? this.redondear2(dto.gastosPresupuestados)
          : item.gastosPresupuestados,
      notas: dto.notas !== undefined ? (dto.notas ?? null) : item.notas,
      fechaActualizacion: new Date(),
    });

    return this.buscarPorId(publicId);
  }

  async eliminar(publicId: string) {
    const item = await this.buscarPorId(publicId);
    await this.presupuestoRepository.delete(item.id);
    return { msg: 'Presupuesto eliminado exitosamente' };
  }

  private async resolverCentro(publicId: string) {
    const centro = await this.centrosCostoService.buscarPorId(publicId);
    if (!centro.activo) {
      throw new BadRequestException(
        `El centro de costo ${centro.codigo} está inactivo`,
      );
    }
    return centro.id;
  }

  private redondear2(valor: number) {
    return Math.round(Number(valor) * 100) / 100;
  }
}
