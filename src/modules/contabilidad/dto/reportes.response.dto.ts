import { ApiProperty } from '@nestjs/swagger';

export class ReporteCuentaDto {
  @ApiProperty({ example: '1101' })
  codigo: string;

  @ApiProperty({ example: 'Caja' })
  nombre: string;

  @ApiProperty({ example: 'activo' })
  tipo: string;

  @ApiProperty({ example: 'deudora' })
  naturaleza: string;

  @ApiProperty({ example: 1000 })
  debe: number;

  @ApiProperty({ example: 200 })
  haber: number;

  @ApiProperty({ example: 800 })
  saldo: number;

  @ApiProperty({ example: 800 })
  saldoDeudor: number;

  @ApiProperty({ example: 0 })
  saldoAcreedor: number;
}

export class BalanzaResponseDto {
  @ApiProperty({ type: [ReporteCuentaDto] })
  cuentas: ReporteCuentaDto[];

  @ApiProperty({
    example: { debe: 1000, haber: 1000, saldoDeudor: 800, saldoAcreedor: 800 },
  })
  totales: {
    debe: number;
    haber: number;
    saldoDeudor: number;
    saldoAcreedor: number;
  };
}

export class EstadoResultadosResponseDto {
  @ApiProperty({ example: 15000 })
  ingresos: number;

  @ApiProperty({ example: 9000 })
  gastos: number;

  @ApiProperty({ example: 6000 })
  utilidad: number;

  @ApiProperty({ type: [ReporteCuentaDto] })
  cuentas: ReporteCuentaDto[];
}

export class BalanceSeccionDto {
  @ApiProperty({ type: [ReporteCuentaDto] })
  cuentas: ReporteCuentaDto[];

  @ApiProperty({ example: 100000 })
  total: number;
}

export class BalanceGeneralResponseDto {
  @ApiProperty({ type: BalanceSeccionDto })
  activo: BalanceSeccionDto;

  @ApiProperty({ type: BalanceSeccionDto })
  pasivo: BalanceSeccionDto;

  @ApiProperty({ type: BalanceSeccionDto })
  capital: BalanceSeccionDto;

  @ApiProperty({
    example: { ingresos: 15000, gastos: 9000, utilidad: 6000 },
  })
  resultados: {
    ingresos: number;
    gastos: number;
    utilidad: number;
  };

  @ApiProperty({ example: 100000 })
  totalActivo: number;

  @ApiProperty({ example: 100000 })
  totalPasivoCapital: number;

  @ApiProperty({ example: true })
  cuadra: boolean;
}

export class MayorCuentaDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: '1101' })
  codigo: string;

  @ApiProperty({ example: 'Caja' })
  nombre: string;

  @ApiProperty({ example: 'activo' })
  tipo: string;

  @ApiProperty({ example: 'deudora' })
  naturaleza: string;
}

export class MayorMovimientoDto {
  @ApiProperty({ example: '2026-11-10' })
  fecha: string;

  @ApiProperty({ example: 'POL-202611-0001' })
  folio: string;

  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000002' })
  polizaId: string;

  @ApiProperty({ example: 'Cobro de cuenta por cobrar (efectivo)' })
  concepto: string;

  @ApiProperty({ example: 'SPEI-123', nullable: true })
  referencia: string | null;

  @ApiProperty({ example: 100 })
  debe: number;

  @ApiProperty({ example: 0 })
  haber: number;

  @ApiProperty({ example: 100 })
  saldo: number;
}

export class MayorTotalesDto {
  @ApiProperty({ example: 1000 })
  debe: number;

  @ApiProperty({ example: 200 })
  haber: number;

  @ApiProperty({ example: 800 })
  saldoFinal: number;
}

export class MayorResponseDto {
  @ApiProperty({ example: '2026-11-01' })
  desde: string;

  @ApiProperty({ example: '2026-11-30' })
  hasta: string;

  @ApiProperty({ type: MayorCuentaDto })
  cuenta: MayorCuentaDto;

  @ApiProperty({ example: 500 })
  saldoInicial: number;

  @ApiProperty({ type: [MayorMovimientoDto] })
  movimientos: MayorMovimientoDto[];

  @ApiProperty({ type: MayorTotalesDto })
  totales: MayorTotalesDto;
}

export class AuxiliarMovimientoDto {
  @ApiProperty({ example: '2026-11-10' })
  fecha: string;

  @ApiProperty({ example: 'cargo', enum: ['cargo', 'abono'] })
  tipo: string;

  @ApiProperty({ example: 'CXC-VT-20261110-0001' })
  folio: string;

  @ApiProperty({ example: 'Cuenta por cobrar CXC-VT-20261110-0001' })
  concepto: string;

  @ApiProperty({ example: 1160 })
  monto: number;

  @ApiProperty({ example: 1160 })
  saldo: number;
}

export class AuxiliarTotalesDto {
  @ApiProperty({ example: 1160 })
  cargos: number;

  @ApiProperty({ example: 500 })
  abonos: number;

  @ApiProperty({ example: 660 })
  saldoFinal: number;
}

export class AuxiliarPersonaDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: 'CLI-001' })
  codigo: string;

  @ApiProperty({ example: 'Cliente Demo' })
  nombre: string;
}

export class AuxiliarDetalleResponseDto {
  @ApiProperty({ example: '2026-11-01' })
  desde: string;

  @ApiProperty({ example: '2026-11-30' })
  hasta: string;

  @ApiProperty({ type: AuxiliarPersonaDto })
  cliente: AuxiliarPersonaDto;

  @ApiProperty({ example: 0 })
  saldoInicial: number;

  @ApiProperty({ type: [AuxiliarMovimientoDto] })
  movimientos: AuxiliarMovimientoDto[];

  @ApiProperty({ type: AuxiliarTotalesDto })
  totales: AuxiliarTotalesDto;
}

export class AuxiliarResumenItemDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: 'CLI-001' })
  codigo: string;

  @ApiProperty({ example: 'Cliente Demo' })
  nombre: string;

  @ApiProperty({ example: 1160 })
  cargos: number;

  @ApiProperty({ example: 500 })
  abonos: number;

  @ApiProperty({ example: 660 })
  saldo: number;
}

export class AuxiliarResumenResponseDto {
  @ApiProperty({ example: '2026-11-01' })
  desde: string;

  @ApiProperty({ example: '2026-11-30' })
  hasta: string;

  @ApiProperty({ type: [AuxiliarResumenItemDto] })
  clientes: AuxiliarResumenItemDto[];

  @ApiProperty({
    example: { cargos: 1160, abonos: 500, saldo: 660 },
  })
  totales: { cargos: number; abonos: number; saldo: number };
}
