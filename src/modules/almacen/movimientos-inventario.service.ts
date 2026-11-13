import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoInventario } from './entities/movimiento-inventario.entity';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { ProductosService } from './productos.service';
import { AlmacenesService } from './almacenes.service';
import { InventarioService } from './inventario.service';

@Injectable()
export class MovimientosInventarioService {
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly movimientoRepository: Repository<MovimientoInventario>,
    private readonly productosService: ProductosService,
    private readonly almacenesService: AlmacenesService,
    private readonly inventarioService: InventarioService,
  ) {}

  async crearMovimiento(dto: CreateMovimientoInventarioDto, usuarioId: number) {
    const producto = await this.productosService.buscarProductoPorId(
      dto.productoId,
    );
    const almacen = await this.almacenesService.buscarAlmacenPorId(
      dto.almacenId,
    );
    return await this.inventarioService.actualizarInventario(
      producto.id,
      almacen.id,
      dto.cantidad,
      dto.tipo as 'entrada' | 'salida' | 'ajuste',
      dto.referencia,
      dto.observaciones,
      usuarioId,
    );
  }

  async buscarMovimientos(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1 } = paginacionDto;
    const [data, total] = await this.movimientoRepository.findAndCount({
      take: registros,
      skip: (pagina - 1) * registros,
      relations: {
        producto: {
          unidadMedida: true,
        },
        almacen: true,
        usuario: true,
      },
      order: { fechaCreacion: 'DESC' },
    });

    return { total, data };
  }
}
