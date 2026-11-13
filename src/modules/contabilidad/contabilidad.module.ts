import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentaContable } from './entities/cuenta-contable.entity';
import { PeriodoContable } from './entities/periodo-contable.entity';
import { Poliza } from './entities/poliza.entity';
import { PolizaDetalle } from './entities/poliza-detalle.entity';
import { CuentaPorCobrar } from './entities/cuenta-por-cobrar.entity';
import { CobroCxC } from './entities/cobro-cxc.entity';
import { CuentaPorPagar } from './entities/cuenta-por-pagar.entity';
import { PagoCxP } from './entities/pago-cxp.entity';
import { SecuenciaFolio } from './entities/secuencia-folio.entity';
import { DeclaracionIva } from './entities/declaracion-iva.entity';
import { CuentaBancaria } from './entities/cuenta-bancaria.entity';
import { MovimientoBancario } from './entities/movimiento-bancario.entity';
import { ReglaConciliacion } from './entities/regla-conciliacion.entity';
import { ConciliacionBancaria } from './entities/conciliacion-bancaria.entity';
import { CentroCosto } from './entities/centro-costo.entity';
import { PresupuestoCentroCosto } from './entities/presupuesto-centro-costo.entity';
import { Nomina } from './entities/nomina.entity';
import { NominaDetalle } from './entities/nomina-detalle.entity';
import { Empleado } from '../rh/entities/empleado.entity';
import { CuentasService } from './cuentas.service';
import { PeriodosService } from './periodos.service';
import { PolizasService } from './polizas.service';
import { ReportesContablesService } from './reportes-contables.service';
import { IntegracionContableService } from './integracion-contable.service';
import { CxcService } from './cxc.service';
import { CxpService } from './cxp.service';
import { CarteraResumenService } from './cartera-resumen.service';
import { BackfillService } from './backfill.service';
import { FoliosService } from './folios.service';
import { ImpuestosService } from './impuestos.service';
import { BancosService } from './bancos.service';
import { ReglasConciliacionService } from './reglas-conciliacion.service';
import { CentrosCostoService } from './centros-costo.service';
import { PresupuestosService } from './presupuestos.service';
import { NominaService } from './nomina.service';
import { CuentasController } from './cuentas.controller';
import { PeriodosController } from './periodos.controller';
import { PolizasController } from './polizas.controller';
import { ReportesContablesController } from './reportes-contables.controller';
import { CxcController } from './cxc.controller';
import { CxpController } from './cxp.controller';
import { CarteraController } from './cartera.controller';
import { ImpuestosController } from './impuestos.controller';
import { BancosController } from './bancos.controller';
import { ReglasConciliacionController } from './reglas-conciliacion.controller';
import { CentrosCostoController } from './centros-costo.controller';
import { PresupuestosController } from './presupuestos.controller';
import { NominaController } from './nomina.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CuentaContable,
      PeriodoContable,
      Poliza,
      PolizaDetalle,
      CuentaPorCobrar,
      CobroCxC,
      CuentaPorPagar,
      PagoCxP,
      SecuenciaFolio,
      DeclaracionIva,
      CuentaBancaria,
      MovimientoBancario,
      ReglaConciliacion,
      ConciliacionBancaria,
      CentroCosto,
      PresupuestoCentroCosto,
      Nomina,
      NominaDetalle,
      Empleado,
    ]),
  ],
  controllers: [
    CuentasController,
    PeriodosController,
    PolizasController,
    ReportesContablesController,
    CxcController,
    CxpController,
    CarteraController,
    ImpuestosController,
    BancosController,
    ReglasConciliacionController,
    CentrosCostoController,
    PresupuestosController,
    NominaController,
  ],
  providers: [
    CuentasService,
    PeriodosService,
    PolizasService,
    ReportesContablesService,
    IntegracionContableService,
    CxcService,
    CxpService,
    CarteraResumenService,
    BackfillService,
    FoliosService,
    ImpuestosService,
    BancosService,
    ReglasConciliacionService,
    CentrosCostoService,
    PresupuestosService,
    NominaService,
  ],
  exports: [
    CuentasService,
    PeriodosService,
    PolizasService,
    IntegracionContableService,
    CxcService,
    CxpService,
    FoliosService,
    CentrosCostoService,
  ],
})
export class ContabilidadModule {}
