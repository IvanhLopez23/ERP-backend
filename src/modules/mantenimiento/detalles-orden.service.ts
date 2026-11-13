import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdenTrabajo } from './entities/orden-trabajo.entity';
import { DetalleOrdenTrabajo } from './entities/detalle-orden-trabajo.entity';
import { CreateDetalleOrdenTrabajoDto } from './dto/create-detalle-orden.dto';
import { UpdateDetalleOrdenTrabajoDto } from './dto/update-detalle-orden.dto';

@Injectable()
export class DetallesOrdenService {
  constructor(
    @InjectRepository(OrdenTrabajo)
    private readonly ordenRepository: Repository<OrdenTrabajo>,
    @InjectRepository(DetalleOrdenTrabajo)
    private readonly detalleRepository: Repository<DetalleOrdenTrabajo>,
  ) {}

  async crearDetalle(ordenPublicId: string, dto: CreateDetalleOrdenTrabajoDto) {
    const orden = await this.ordenRepository.findOne({
      where: { publicId: ordenPublicId },
    });
    if (!orden)
      throw new BadRequestException(
        `La orden de trabajo ${ordenPublicId} no existe`,
      );
    const data = this.detalleRepository.create({
      ...dto,
      ordenTrabajoId: orden.id,
    });
    return await this.detalleRepository.save(data);
  }

  async buscarDetallesPorOrden(ordenPublicId: string) {
    const orden = await this.ordenRepository.findOne({
      where: { publicId: ordenPublicId },
    });
    if (!orden)
      throw new BadRequestException(
        `La orden de trabajo ${ordenPublicId} no existe`,
      );
    return await this.detalleRepository.find({
      where: { ordenTrabajoId: orden.id },
      order: { id: 'ASC' },
    });
  }

  async actualizarDetalle(publicId: string, dto: UpdateDetalleOrdenTrabajoDto) {
    const item = await this.detalleRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El detalle ${publicId} no existe`);
    await this.detalleRepository.update(item.id, dto);
    return { msg: 'Detalle actualizado exitosamente' };
  }
}
