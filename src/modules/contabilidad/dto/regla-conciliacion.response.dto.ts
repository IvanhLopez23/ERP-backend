import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReglaConciliacionResponseDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: 'Cobros por referencia IMP' })
  nombre: string;

  @ApiPropertyOptional({ example: '<uuid>', nullable: true })
  cuentaBancariaId?: number | null;

  @ApiProperty({ example: 10 })
  prioridad: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: 'ambos' })
  tipoMovimiento: string;

  @ApiPropertyOptional({ example: 'IMP-', nullable: true })
  referenciaContiene?: string | null;

  @ApiPropertyOptional({ example: 'CLIENTE DEMO', nullable: true })
  descripcionContiene?: string | null;

  @ApiProperty({ example: 0 })
  toleranciaMonto: number;

  @ApiProperty({ example: 3 })
  toleranciaDias: number;
}
