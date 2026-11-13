import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuComedorItemResponseDto } from './menu-comedor-item.response.dto';

export class MenuComedorResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Menú de la semana' })
  nombre: string;

  @ApiProperty({ example: 'semanal' })
  periodicidad: string;

  @ApiProperty({ example: '2024-01-01' })
  fechaInicio: Date;

  @ApiProperty({ example: '2024-01-07' })
  fechaFin: Date;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({
    type: () => MenuComedorItemResponseDto,
    isArray: true,
  })
  items?: MenuComedorItemResponseDto[];
}
