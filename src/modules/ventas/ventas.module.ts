import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlmacenModule } from '../almacen/almacen.module';
import { ContabilidadModule } from '../contabilidad/contabilidad.module';
import { VentasService } from './ventas.service';
import { ClientesService } from './clientes.service';
import { CotizacionesService } from './cotizaciones.service';
import { ClientesController } from './clientes.controller';
import { CotizacionesController } from './cotizaciones.controller';
import { VentasController } from './ventas.controller';
import { DetalleCotizacionController } from './detalle-cotizacion.controller';
import { DetalleVentaController } from './detalle-venta.controller';
import { Cliente } from './entities/cliente.entity';
import { Cotizacion } from './entities/cotizacion.entity';
import { DetalleCotizacion } from './entities/detalle-cotizacion.entity';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente,
      Cotizacion,
      DetalleCotizacion,
      Venta,
      DetalleVenta,
    ]),
    AlmacenModule,
    ContabilidadModule,
  ],
  controllers: [
    ClientesController,
    CotizacionesController,
    VentasController,
    DetalleCotizacionController,
    DetalleVentaController,
  ],
  providers: [ClientesService, CotizacionesService, VentasService],
})
export class VentasModule {}
