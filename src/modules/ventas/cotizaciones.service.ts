import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { Cotizacion } from './entities/cotizacion.entity';
import { DetalleCotizacion } from './entities/detalle-cotizacion.entity';
import { Empleado } from '../rh/entities/empleado.entity';
import { Producto } from '../almacen/entities/producto.entity';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateEstatusCotizacionDto } from './dto/update-estatus-cotizacion.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { calcularDetalles } from './helpers/calcular-detalles';

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,
    @InjectRepository(DetalleCotizacion)
    private readonly detalleCotRepository: Repository<DetalleCotizacion>,
    private readonly dataSource: DataSource,
  ) {}

  private async generarFolioCotizacion(): Promise<string> {
    const count = await this.cotizacionRepository.count();
    const fecha = new Date();
    const sec = String(count + 1).padStart(4, '0');
    return `COT-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${sec}`;
  }

  async crearCotizacion(dto: CreateCotizacionDto, usuarioId: number) {
    try {
      const cliente = await this.clienteRepository.findOne({
        where: { publicId: dto.clienteId },
      });
      if (!cliente)
        throw new BadRequestException(`El cliente ${dto.clienteId} no existe`);

      let vendedorId: number | undefined;
      if (dto.vendedorId) {
        const vendedor = await this.dataSource
          .getRepository(Empleado)
          .findOne({ where: { publicId: dto.vendedorId } });
        if (!vendedor)
          throw new BadRequestException(
            `El vendedor ${dto.vendedorId} no existe`,
          );
        vendedorId = vendedor.id;
      }

      const folio = await this.generarFolioCotizacion();
      const { procesados, subtotal, descuento, iva, total } = calcularDetalles(
        dto.detalles,
      );
      const detallesResueltos = await Promise.all(
        procesados.map(async (d) => {
          const producto = await this.dataSource
            .getRepository(Producto)
            .findOne({ where: { publicId: d.productoId } });
          if (!producto)
            throw new BadRequestException(
              `El producto ${d.productoId} no existe`,
            );
          return {
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            descuento: d.descuento,
            subtotal: d.subtotal,
            productoId: producto.id,
          };
        }),
      );
      const cotizacion = this.cotizacionRepository.create({
        folio,
        clienteId: cliente.id,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        diasValidez: dto.diasValidez || 30,
        subtotal,
        descuento,
        iva,
        total,
        observaciones: dto.observaciones,
        vendedorId,
        usuarioId,
      });
      const guardada = await this.cotizacionRepository.save(cotizacion);
      const detalles = detallesResueltos.map((d) => ({
        ...d,
        cotizacionId: guardada.id,
      }));
      await this.detalleCotRepository.save(detalles);
      return await this.cotizacionRepository.findOne({
        where: { id: guardada.id },
        relations: {
          cliente: true,
          vendedor: true,
          usuario: true,
          detalles: {
            producto: true,
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarCotizaciones() {
    return await this.cotizacionRepository.find({
      relations: {
        cliente: true,
        vendedor: true,
        detalles: {
          producto: true,
        },
      },
      order: { id: 'DESC' },
    });
  }

  async paginarCotizaciones(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.folio = ILike(`%${buscar}%`);
    const data = await this.cotizacionRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        cliente: true,
        vendedor: true,
      },
      order: { id: 'DESC' },
    });
    const total = await this.cotizacionRepository.count({ where });
    return { total, data };
  }

  async buscarCotizacionPorId(publicId: string) {
    const item = await this.cotizacionRepository.findOne({
      where: { publicId },
      relations: {
        cliente: true,
        vendedor: true,
        usuario: true,
        detalles: {
          producto: true,
        },
      },
    });
    if (!item)
      throw new BadRequestException(`La cotización ${publicId} no existe`);
    return item;
  }

  async buscarCotizacionesPorCliente(clienteId: string) {
    const cliente = await this.clienteRepository.findOne({
      where: { publicId: clienteId },
    });
    if (!cliente)
      throw new BadRequestException(`El cliente ${clienteId} no existe`);
    return await this.cotizacionRepository.find({
      where: { clienteId: cliente.id },
      relations: {
        cliente: true,
        detalles: {
          producto: true,
        },
      },
      order: { id: 'DESC' },
    });
  }

  async actualizarEstatusCotizacion(
    publicId: string,
    dto: UpdateEstatusCotizacionDto,
  ) {
    const cot = await this.cotizacionRepository.findOne({
      where: { publicId },
    });
    if (!cot)
      throw new BadRequestException(`La cotización ${publicId} no existe`);
    if (cot.estatus !== 'pendiente') {
      throw new BadRequestException(
        `La cotización ya está ${cot.estatus}, no se puede modificar`,
      );
    }
    await this.cotizacionRepository.update(cot.id, { estatus: dto.estatus });
    return {
      msg: `Cotización ${dto.estatus === 'aprobada' ? 'aprobada' : dto.estatus === 'rechazada' ? 'rechazada' : 'marcada como vencida'} exitosamente`,
    };
  }

  async buscarDetallesCotizacion(cotizacionPublicId: string) {
    const cotizacion = await this.cotizacionRepository.findOne({
      where: { publicId: cotizacionPublicId },
    });
    if (!cotizacion)
      throw new BadRequestException(
        `La cotización ${cotizacionPublicId} no existe`,
      );
    return await this.detalleCotRepository.find({
      where: { cotizacionId: cotizacion.id },
      relations: {
        producto: true,
      },
      order: { id: 'ASC' },
    });
  }
}
