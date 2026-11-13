import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Empleado } from '../rh/entities/empleado.entity';
import { Departamento } from '../rh/entities/departamento.entity';
import { Puesto } from '../rh/entities/puesto.entity';
import { Turno } from '../rh/entities/turno.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Empleado, Departamento, Puesto, Turno])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
