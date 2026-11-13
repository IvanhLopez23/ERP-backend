import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardVentasService } from './ventas.service';
import { DashboardComprasService } from './compras.service';
import { DashboardAlmacenService } from './almacen.service';
import { DashboardRhService } from './rh.service';
import { DashboardMantenimientoService } from './mantenimiento.service';
import { DashboardFinanzasService } from './finanzas.service';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardVentasService,
    DashboardComprasService,
    DashboardAlmacenService,
    DashboardRhService,
    DashboardMantenimientoService,
    DashboardFinanzasService,
  ],
})
export class DashboardModule {}
