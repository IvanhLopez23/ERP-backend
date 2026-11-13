import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { ReglaConciliacion } from './entities/regla-conciliacion.entity';
import { CuentaBancaria } from './entities/cuenta-bancaria.entity';
import { CreateReglaConciliacionDto } from './dto/create-regla-conciliacion.dto';
import {
  ReglasConciliacionQueryDto,
  UpdateReglaConciliacionDto,
} from './dto/update-regla-conciliacion.dto';

@Injectable()
export class ReglasConciliacionService {
  constructor(
    @InjectRepository(ReglaConciliacion)
    private readonly reglaRepository: Repository<ReglaConciliacion>,
    @InjectRepository(CuentaBancaria)
    private readonly cuentaRepository: Repository<CuentaBancaria>,
  ) {}

  async crear(dto: CreateReglaConciliacionDto, usuarioId: number) {
    const cuentaBancariaId = dto.cuentaBancariaId
      ? await this.resolverCuentaBancaria(dto.cuentaBancariaId)
      : null;

    const guardada = await this.reglaRepository.save(
      this.reglaRepository.create({
        nombre: dto.nombre,
        cuentaBancariaId,
        prioridad: dto.prioridad ?? 100,
        activo: dto.activo ?? true,
        tipoMovimiento: dto.tipoMovimiento ?? 'ambos',
        referenciaContiene: dto.referenciaContiene ?? null,
        descripcionContiene: dto.descripcionContiene ?? null,
        toleranciaMonto: this.redondear2(dto.toleranciaMonto ?? 0),
        toleranciaDias: dto.toleranciaDias ?? 3,
        usuarioId,
      }),
    );

    return this.buscarPorId(guardada.publicId);
  }

  async buscar(query: ReglasConciliacionQueryDto) {
    let where:
      | FindOptionsWhere<ReglaConciliacion>
      | FindOptionsWhere<ReglaConciliacion>[] = {};
    if (query.cuentaBancariaId) {
      const cuentaBancariaId = await this.resolverCuentaBancaria(
        query.cuentaBancariaId,
      );
      where = [{ cuentaBancariaId }, { cuentaBancariaId: IsNull() }];
    }

    return this.reglaRepository.find({
      where,
      relations: { cuentaBancaria: true },
      order: { prioridad: 'ASC', id: 'ASC' },
    });
  }

  async buscarPorId(publicId: string) {
    const regla = await this.reglaRepository.findOne({
      where: { publicId },
      relations: { cuentaBancaria: true },
    });
    if (!regla) {
      throw new BadRequestException(`La regla ${publicId} no existe`);
    }
    return regla;
  }

  async actualizar(publicId: string, dto: UpdateReglaConciliacionDto) {
    const regla = await this.buscarPorId(publicId);
    let cuentaBancariaId = regla.cuentaBancariaId;
    if (dto.cuentaBancariaId !== undefined) {
      cuentaBancariaId = dto.cuentaBancariaId
        ? await this.resolverCuentaBancaria(dto.cuentaBancariaId)
        : null;
    }

    await this.reglaRepository.update(regla.id, {
      nombre: dto.nombre ?? regla.nombre,
      cuentaBancariaId,
      prioridad: dto.prioridad ?? regla.prioridad,
      activo: dto.activo ?? regla.activo,
      tipoMovimiento: dto.tipoMovimiento ?? regla.tipoMovimiento,
      referenciaContiene:
        dto.referenciaContiene !== undefined
          ? (dto.referenciaContiene ?? null)
          : regla.referenciaContiene,
      descripcionContiene:
        dto.descripcionContiene !== undefined
          ? (dto.descripcionContiene ?? null)
          : regla.descripcionContiene,
      toleranciaMonto:
        dto.toleranciaMonto !== undefined
          ? this.redondear2(dto.toleranciaMonto)
          : regla.toleranciaMonto,
      toleranciaDias: dto.toleranciaDias ?? regla.toleranciaDias,
      fechaActualizacion: new Date(),
    });

    return this.buscarPorId(publicId);
  }

  async activarDesactivar(publicId: string) {
    const regla = await this.buscarPorId(publicId);
    await this.reglaRepository.update(regla.id, {
      activo: !regla.activo,
      fechaActualizacion: new Date(),
    });
    return {
      msg: `Regla ${!regla.activo ? 'activada' : 'desactivada'} correctamente`,
    };
  }

  private async resolverCuentaBancaria(publicId: string) {
    const cuenta = await this.cuentaRepository.findOne({
      where: { publicId },
    });
    if (!cuenta) {
      throw new BadRequestException(`La cuenta bancaria ${publicId} no existe`);
    }
    return cuenta.id;
  }

  private redondear2(valor: number) {
    return Math.round(Number(valor) * 100) / 100;
  }
}
