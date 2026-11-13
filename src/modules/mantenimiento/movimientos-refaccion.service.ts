import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdenTrabajo } from './entities/orden-trabajo.entity';
import { Refaccion } from './entities/refaccion.entity';
import { MovimientoRefaccion } from './entities/movimiento-refaccion.entity';
import { CreateMovimientoRefaccionDto } from './dto/create-movimiento-refaccion.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { InventarioService } from '../almacen/inventario.service';

@Injectable()
export class MovimientosRefaccionService {
  constructor(
    @InjectRepository(OrdenTrabajo)
    private readonly ordenRepository: Repository<OrdenTrabajo>,
    @InjectRepository(Refaccion)
    private readonly refaccionRepository: Repository<Refaccion>,
    @InjectRepository(MovimientoRefaccion)
    private readonly movimientoRepository: Repository<MovimientoRefaccion>,
    private readonly inventarioService: InventarioService,
  ) {}

  async crearMovimientoRefaccion(
    dto: CreateMovimientoRefaccionDto,
    usuarioId: number,
  ) {
    try {
      const refaccion = await this.refaccionRepository.findOne({
        where: { publicId: dto.refaccionId },
      });
      if (!refaccion)
        throw new BadRequestException(
          `La refacción ${dto.refaccionId} no existe`,
        );

      let ordenTrabajoIdResolved: number | undefined = undefined;
      if (dto.ordenTrabajoId !== undefined) {
        const orden = await this.ordenRepository.findOne({
          where: { publicId: dto.ordenTrabajoId },
        });
        if (!orden)
          throw new BadRequestException(
            `La orden de trabajo ${dto.ordenTrabajoId} no existe`,
          );
        ordenTrabajoIdResolved = orden.id;
      }

      if (refaccion.productoId) {
        await this.inventarioService.actualizarInventario(
          refaccion.productoId,
          1,
          dto.cantidad,
          dto.tipo as 'entrada' | 'salida' | 'ajuste',
          ordenTrabajoIdResolved ? `OT-${ordenTrabajoIdResolved}` : undefined,
          dto.observaciones || `Movimiento de refacción ${refaccion.codigo}`,
          usuarioId,
        );
      }

      const data = this.movimientoRepository.create({
        ...dto,
        refaccionId: refaccion.id,
        ordenTrabajoId: ordenTrabajoIdResolved,
        usuarioId,
      });
      return await this.movimientoRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarMovimientosRefaccion(
    paginacionDto: PaginacionDto,
    refaccionId?: string,
    tipo?: string,
  ) {
    const { registros = 10, pagina = 1 } = paginacionDto;
    const where: any = {};
    if (refaccionId) {
      const refaccion = await this.refaccionRepository.findOne({
        where: { publicId: refaccionId },
      });
      if (!refaccion)
        throw new BadRequestException(`La refacción ${refaccionId} no existe`);
      where.refaccionId = refaccion.id;
    }
    if (tipo) where.tipo = tipo;
    const data = await this.movimientoRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        refaccion: true,
        usuario: true,
      },
      order: { fechaCreacion: 'DESC' },
    });
    const total = await this.movimientoRepository.count({ where });
    return { total, data };
  }
}
