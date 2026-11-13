import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PeriodoContableResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 2026 })
  anio: number;

  @ApiProperty({ example: 11 })
  mes: number;

  @ApiProperty({ example: '2026-11-01' })
  fechaInicio: string;

  @ApiProperty({ example: '2026-11-30' })
  fechaFin: string;

  @ApiProperty({ example: 'abierto' })
  estatus: string;

  @ApiPropertyOptional({ example: '2026-12-01T00:00:00.000Z' })
  fechaCierre?: Date;
}
