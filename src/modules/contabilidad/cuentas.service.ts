import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ILike, Repository } from 'typeorm';
import { CuentaContable } from './entities/cuenta-contable.entity';
import { CreateCuentaContableDto } from './dto/create-cuenta-contable.dto';
import { UpdateCuentaContableDto } from './dto/update-cuenta-contable.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { naturalezaPorDefecto, TipoCuenta } from './contabilidad.constants';

@Injectable()
export class CuentasService {
  constructor(
    @InjectRepository(CuentaContable)
    private readonly cuentaRepository: Repository<CuentaContable>,
  ) {}

  async crear(dto: CreateCuentaContableDto) {
    const existe = await this.cuentaRepository.findOne({
      where: { codigo: dto.codigo },
    });
    if (existe) {
      throw new BadRequestException(`La cuenta ${dto.codigo} ya existe`);
    }

    const padre = await this.resolverPadre(dto.padreId);
    const tipo = dto.tipo as TipoCuenta;
    const naturaleza = dto.naturaleza ?? naturalezaPorDefecto(tipo);

    const data = this.cuentaRepository.create({
      codigo: dto.codigo,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      tipo: dto.tipo,
      naturaleza,
      padreId: padre?.id ?? null,
      nivel: padre ? padre.nivel + 1 : 1,
      permiteMovimientos: dto.permiteMovimientos ?? true,
      activo: dto.activo ?? true,
    });

    return this.cuentaRepository.save(data);
  }

  async buscar() {
    return this.cuentaRepository.find({
      relations: { padre: true },
      order: { codigo: 'ASC' },
    });
  }

  async buscarArbol() {
    const cuentas = await this.cuentaRepository.find({
      order: { codigo: 'ASC' },
    });
    const mapa = new Map<number, CuentaContable>();
    const raices: CuentaContable[] = [];

    for (const cuenta of cuentas) {
      mapa.set(cuenta.id, { ...cuenta, hijos: [] });
    }

    for (const cuenta of cuentas) {
      const nodo = mapa.get(cuenta.id);
      if (!nodo) continue;
      const padre = cuenta.padreId ? mapa.get(cuenta.padreId) : undefined;
      if (padre) padre.hijos.push(nodo);
      else raices.push(nodo);
    }

    return raices;
  }

  async paginar(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where = buscar
      ? [{ codigo: ILike(`%${buscar}%`) }, { nombre: ILike(`%${buscar}%`) }]
      : {};
    const [data, total] = await this.cuentaRepository.findAndCount({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { codigo: 'ASC' },
    });
    return { total, data };
  }

  async buscarPorCodigo(codigo: string, manager?: EntityManager) {
    const repositorio = manager
      ? manager.getRepository(CuentaContable)
      : this.cuentaRepository;
    const cuenta = await repositorio.findOne({
      where: { codigo },
    });
    if (!cuenta) {
      throw new BadRequestException(`La cuenta contable ${codigo} no existe`);
    }
    return cuenta;
  }

  async buscarPorId(publicId: string) {
    const item = await this.cuentaRepository.findOne({
      where: { publicId },
      relations: { padre: true, hijos: true },
    });
    if (!item) {
      throw new BadRequestException(`La cuenta contable ${publicId} no existe`);
    }
    return item;
  }

  async actualizar(publicId: string, dto: UpdateCuentaContableDto) {
    const item = await this.buscarPorId(publicId);

    if (dto.codigo && dto.codigo !== item.codigo) {
      const dup = await this.cuentaRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (dup && dup.id !== item.id) {
        throw new BadRequestException(`El código ${dto.codigo} ya está en uso`);
      }
    }

    let padre = item.padre ?? null;
    if (dto.padreId !== undefined) {
      padre = await this.resolverPadre(dto.padreId);
      if (!padre) {
        throw new BadRequestException('La cuenta padre no existe');
      }
      if (padre.id === item.id) {
        throw new BadRequestException(
          'Una cuenta no puede ser padre de sí misma',
        );
      }
      await this.validarCiclo(item.id, padre.id);
    }

    const tipo = (dto.tipo ?? item.tipo) as TipoCuenta;
    const naturaleza =
      dto.naturaleza ??
      (dto.tipo ? naturalezaPorDefecto(tipo) : item.naturaleza);
    const nivel = padre ? padre.nivel + 1 : 1;

    const updateData: any = {
      tipo,
      naturaleza,
      padreId: padre?.id ?? null,
      nivel,
    };
    if (dto.codigo !== undefined) updateData.codigo = dto.codigo;
    if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion;
    if (dto.permiteMovimientos !== undefined)
      updateData.permiteMovimientos = dto.permiteMovimientos;
    if (dto.activo !== undefined) updateData.activo = dto.activo;

    await this.cuentaRepository.update(item.id, updateData);

    if (nivel !== item.nivel || (padre?.id ?? null) !== item.padreId) {
      await this.actualizarNiveles(item.id, nivel);
    }

    return { msg: 'Cuenta contable actualizada exitosamente' };
  }

  async activarDesactivar(publicId: string) {
    const item = await this.buscarPorId(publicId);
    await this.cuentaRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Cuenta ${!item.activo ? 'activada' : 'desactivada'} correctamente`,
    };
  }

  private async resolverPadre(publicId?: string) {
    if (!publicId) return null;
    const padre = await this.cuentaRepository.findOne({
      where: { publicId },
    });
    if (!padre) {
      throw new BadRequestException(`La cuenta padre ${publicId} no existe`);
    }
    return padre;
  }

  private async validarCiclo(cuentaId: number, padreId: number) {
    let actual: number | null = padreId;
    const visitados = new Set<number>();

    while (actual !== null) {
      if (actual === cuentaId) {
        throw new BadRequestException(
          'La jerarquía de cuentas generaría un ciclo',
        );
      }
      if (visitados.has(actual)) break;
      visitados.add(actual);
      const cuenta = await this.cuentaRepository.findOne({
        where: { id: actual },
        select: { id: true, padreId: true },
      });
      actual = cuenta?.padreId ?? null;
    }
  }

  private async actualizarNiveles(cuentaId: number, nivel: number) {
    await this.cuentaRepository.update(cuentaId, { nivel });
    const hijos = await this.cuentaRepository.find({
      where: { padreId: cuentaId },
      select: { id: true },
    });
    for (const hijo of hijos) {
      await this.actualizarNiveles(hijo.id, nivel + 1);
    }
  }
}
