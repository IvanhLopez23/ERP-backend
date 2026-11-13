import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrdenTrabajoResponseDto } from './orden-trabajo.response.dto';

export class DetalleOrdenTrabajoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Limpieza de filtros' })
  descripcion: string;

  @ApiProperty({ example: true })
  completado: boolean;

  @ApiPropertyOptional({ example: 'Realizado sin contratiempos' })
  observaciones?: string;

  @ApiPropertyOptional({ type: () => OrdenTrabajoResponseDto })
  ordenTrabajo?: OrdenTrabajoResponseDto;
}
