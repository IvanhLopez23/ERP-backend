import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CuentaBancariaResponseDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: 'Cuenta operativa BBVA' })
  nombre: string;

  @ApiProperty({ example: 'BBVA' })
  banco: string;

  @ApiPropertyOptional({ example: '0123456789', nullable: true })
  numeroCuenta?: string | null;

  @ApiPropertyOptional({ example: '012180001234567890', nullable: true })
  clabe?: string | null;

  @ApiProperty({ example: 'MXN' })
  moneda: string;

  @ApiProperty({ example: 0 })
  saldoInicial: number;

  @ApiProperty({ example: 2 })
  cuentaContableId: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiPropertyOptional({
    example: { codigo: '1102', nombre: 'Bancos' },
  })
  cuentaContable?: { codigo: string; nombre: string };
}

export class ConciliacionBancariaDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000003' })
  publicId: string;

  @ApiPropertyOptional({ example: '<uuid>', nullable: true })
  polizaDetalleId?: string | null;

  @ApiPropertyOptional({ example: 'POL-202611-0001', nullable: true })
  polizaFolio?: string | null;

  @ApiProperty({ example: 100 })
  monto: number;
}

export class MovimientoBancarioResponseDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000002' })
  publicId: string;

  @ApiProperty({ example: '2026-11-10' })
  fecha: string;

  @ApiProperty({ example: 'SPEI recibido de cliente' })
  descripcion: string;

  @ApiPropertyOptional({ example: 'SPEI-123', nullable: true })
  referencia?: string | null;

  @ApiProperty({ example: 1000 })
  cargo: number;

  @ApiProperty({ example: 0 })
  abono: number;

  @ApiPropertyOptional({ example: 5000, nullable: true })
  saldo?: number | null;

  @ApiProperty({ example: true })
  conciliado: boolean;

  @ApiPropertyOptional({ example: 'POL-202611-0001', nullable: true })
  polizaFolio?: string | null;

  @ApiPropertyOptional({ type: [ConciliacionBancariaDto] })
  conciliaciones?: ConciliacionBancariaDto[];

  @ApiPropertyOptional({ example: '2026-11-10T10:00:00.000Z', nullable: true })
  conciliadoEn?: Date | null;
}

export class ConciliacionResponseDto {
  @ApiProperty({ type: CuentaBancariaResponseDto })
  cuentaBancaria: CuentaBancariaResponseDto;

  @ApiProperty({ example: '2026-11-01' })
  desde: string;

  @ApiProperty({ example: '2026-11-30' })
  hasta: string;

  @ApiProperty({ example: 15000 })
  saldoContable: number;

  @ApiProperty({ example: 14500 })
  saldoBanco: number;

  @ApiProperty({ example: 500 })
  diferencia: number;

  @ApiProperty({ type: [Object] })
  partidasContables: Array<Record<string, unknown>>;

  @ApiProperty({ type: [MovimientoBancarioResponseDto] })
  movimientosBanco: MovimientoBancarioResponseDto[];
}
