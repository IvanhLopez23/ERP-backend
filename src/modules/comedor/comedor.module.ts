import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from '../roles/entities/role.entity';
import { Empleado } from '../rh/entities/empleado.entity';
import { Turno } from '../rh/entities/turno.entity';
import { ComedorController } from './comedor.controller';
import { ComedorService } from './comedor.service';
import { MenuComedor } from './entities/menu-comedor.entity';
import { MenuComedorItem } from './entities/menu-comedor-item.entity';
import { SolicitudComedor } from './entities/solicitud-comedor.entity';
import { SolicitudComedorDetalle } from './entities/solicitud-comedor-detalle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roles,
      Empleado,
      Turno,
      MenuComedor,
      MenuComedorItem,
      SolicitudComedor,
      SolicitudComedorDetalle,
    ]),
  ],
  controllers: [ComedorController],
  providers: [ComedorService],
  exports: [ComedorService],
})
export class ComedorModule {}
