import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlmacenModule } from '../almacen/almacen.module';
import { EquiposService } from './equipos.service';
import { PlanesMantenimientoService } from './planes-mantenimiento.service';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';
import { DetallesOrdenService } from './detalles-orden.service';
import { RefaccionesService } from './refacciones.service';
import { MovimientosRefaccionService } from './movimientos-refaccion.service';
import { EquiposController } from './equipos.controller';
import { PlanesMantenimientoController } from './planes-mantenimiento.controller';
import { OrdenesTrabajoController } from './ordenes-trabajo.controller';
import { DetallesOrdenController } from './detalles-orden.controller';
import { RefaccionesController } from './refacciones.controller';
import { MovimientosRefaccionController } from './movimientos-refaccion.controller';
import { Equipo } from './entities/equipo.entity';
import { PlanMantenimiento } from './entities/plan-mantenimiento.entity';
import { OrdenTrabajo } from './entities/orden-trabajo.entity';
import { DetalleOrdenTrabajo } from './entities/detalle-orden-trabajo.entity';
import { Refaccion } from './entities/refaccion.entity';
import { MovimientoRefaccion } from './entities/movimiento-refaccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Equipo,
      PlanMantenimiento,
      OrdenTrabajo,
      DetalleOrdenTrabajo,
      Refaccion,
      MovimientoRefaccion,
    ]),
    AlmacenModule,
  ],
  controllers: [
    EquiposController,
    PlanesMantenimientoController,
    OrdenesTrabajoController,
    DetallesOrdenController,
    RefaccionesController,
    MovimientosRefaccionController,
  ],
  providers: [
    EquiposService,
    PlanesMantenimientoService,
    OrdenesTrabajoService,
    DetallesOrdenService,
    RefaccionesService,
    MovimientosRefaccionService,
  ],
})
export class MantenimientoModule {}
