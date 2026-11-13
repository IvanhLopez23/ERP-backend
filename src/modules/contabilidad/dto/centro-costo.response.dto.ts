import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CentroCostoResponseDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: 'CC-ADMIN' })
  codigo: string;

  @ApiProperty({ example: 'Administración' })
  nombre: string;

  @ApiProperty({ example: 'centro_costo' })
  tipo: string;

  @ApiPropertyOptional({ nullable: true })
  descripcion?: string | null;

  @ApiProperty({ example: true })
  activo: boolean;
}
