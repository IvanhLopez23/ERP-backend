import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartamentosService } from './departamentos.service';
import { PuestosService } from './puestos.service';
import { TurnosService } from './turnos.service';
import { EmpleadosService } from './empleados.service';
import { ContratosService } from './contratos.service';
import { AsistenciasService } from './asistencias.service';
import { SolicitudesPermisoService } from './solicitudes-permiso.service';
import { VacacionesService } from './vacaciones.service';
import { OrganigramaService } from './organigrama.service';
import { DepartamentosController } from './departamentos.controller';
import { PuestosController } from './puestos.controller';
import { TurnosController } from './turnos.controller';
import { EmpleadosController } from './empleados.controller';
import { ContratosController } from './contratos.controller';
import { AsistenciasController } from './asistencias.controller';
import { SolicitudesPermisoController } from './solicitudes-permiso.controller';
import { Departamento } from './entities/departamento.entity';
import { Puesto } from './entities/puesto.entity';
import { Empleado } from './entities/empleado.entity';
import { Contrato } from './entities/contrato.entity';
import { Asistencia } from './entities/asistencia.entity';
import { SolicitudPermiso } from './entities/solicitud-permiso.entity';
import { PoliticaVacacional } from './entities/politica-vacacional.entity';
import { PeriodoVacacional } from './entities/periodo-vacacional.entity';
import { Turno } from './entities/turno.entity';
import { VacacionesController } from './vacaciones.controller';
import { OrganigramaController } from './organigrama.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Departamento,
      Puesto,
      Empleado,
      Contrato,
      Asistencia,
      SolicitudPermiso,
      PoliticaVacacional,
      PeriodoVacacional,
      Turno,
    ]),
    UploadsModule,
  ],
  controllers: [
    DepartamentosController,
    PuestosController,
    TurnosController,
    EmpleadosController,
    ContratosController,
    AsistenciasController,
    SolicitudesPermisoController,
    VacacionesController,
    OrganigramaController,
  ],
  providers: [
    DepartamentosService,
    PuestosService,
    TurnosService,
    EmpleadosService,
    ContratosService,
    AsistenciasService,
    SolicitudesPermisoService,
    VacacionesService,
    OrganigramaService,
  ],
  exports: [EmpleadosService, VacacionesService, OrganigramaService],
})
export class RhModule {}
