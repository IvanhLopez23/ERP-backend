import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasService } from './categorias.service';
import { UnidadesMedidaService } from './unidades-medida.service';
import { ProductosService } from './productos.service';
import { AlmacenesService } from './almacenes.service';
import { InventarioService } from './inventario.service';
import { MovimientosInventarioService } from './movimientos-inventario.service';
import { CategoriasController } from './categorias.controller';
import { UnidadesMedidaController } from './unidades-medida.controller';
import { ProductosController } from './productos.controller';
import { AlmacenesController } from './almacenes.controller';
import { InventarioController } from './inventario.controller';
import { MovimientosInventarioController } from './movimientos-inventario.controller';
import { CortesInventarioController } from './cortes-inventario.controller';
import { CortesInventarioService } from './cortes-inventario.service';
import { OrdenesSalidaController } from './ordenes-salida.controller';
import { OrdenesSalidaService } from './ordenes-salida.service';
import { CategoriaProducto } from './entities/categoria-producto.entity';
import { UnidadMedida } from './entities/unidad-medida.entity';
import { Producto } from './entities/producto.entity';
import { Almacen } from './entities/almacen.entity';
import { Inventario } from './entities/inventario.entity';
import { MovimientoInventario } from './entities/movimiento-inventario.entity';
import { CorteInventario } from './entities/corte-inventario.entity';
import { CorteInventarioDetalle } from './entities/corte-inventario-detalle.entity';
import { OrdenSalida } from './entities/orden-salida.entity';
import { OrdenSalidaDetalle } from './entities/orden-salida-detalle.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { ContabilidadModule } from '../contabilidad/contabilidad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoriaProducto,
      UnidadMedida,
      Producto,
      Almacen,
      Inventario,
      MovimientoInventario,
      CorteInventario,
      CorteInventarioDetalle,
      OrdenSalida,
      OrdenSalidaDetalle,
    ]),
    UploadsModule,
    ContabilidadModule,
  ],
  controllers: [
    CategoriasController,
    UnidadesMedidaController,
    ProductosController,
    AlmacenesController,
    InventarioController,
    MovimientosInventarioController,
    CortesInventarioController,
    OrdenesSalidaController,
  ],
  providers: [
    CategoriasService,
    UnidadesMedidaService,
    ProductosService,
    AlmacenesService,
    InventarioService,
    MovimientosInventarioService,
    CortesInventarioService,
    OrdenesSalidaService,
  ],
  exports: [ProductosService, InventarioService, TypeOrmModule],
})
export class AlmacenModule {}
