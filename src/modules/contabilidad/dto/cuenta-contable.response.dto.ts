import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CuentaContableResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: '1101' })
  codigo: string;

  @ApiProperty({ example: 'Caja' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Efectivo en caja' })
  descripcion?: string;

  @ApiProperty({ example: 'activo' })
  tipo: string;

  @ApiProperty({ example: 'deudora' })
  naturaleza: string;

  @ApiProperty({ example: 1 })
  nivel: number;

  @ApiProperty({ example: true })
  permiteMovimientos: boolean;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiPropertyOptional({ type: () => CuentaContableResponseDto })
  padre?: CuentaContableResponseDto;

  @ApiPropertyOptional({ type: () => [CuentaContableResponseDto] })
  hijos?: CuentaContableResponseDto[];
}
