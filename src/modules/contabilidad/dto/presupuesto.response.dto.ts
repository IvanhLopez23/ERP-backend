import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresupuestoResponseDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: 2026 })
  anio: number;

  @ApiProperty({ example: 11 })
  mes: number;

  @ApiProperty({ example: 1 })
  centroCostoId: number;

  @ApiProperty({ example: 5000 })
  ingresosPresupuestados: number;

  @ApiProperty({ example: 3000 })
  gastosPresupuestados: number;

  @ApiPropertyOptional({ nullable: true })
  notas?: string | null;

  @ApiPropertyOptional({
    example: { codigo: 'CC-ADMIN', nombre: 'Administración' },
  })
  centroCosto?: { codigo: string; nombre: string };
}
