import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmpleadoResponseDto } from '../../rh/dto/empleado.response.dto';
import { MenuComedorResponseDto } from './menu-comedor.response.dto';
import { SolicitudComedorDetalleResponseDto } from './solicitud-comedor-detalle.response.dto';

export class SolicitudComedorResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'solicitada' })
  estatus: string;

  @ApiPropertyOptional({ example: 'Sin picante' })
  observaciones?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaSolicitud: Date;

  @ApiPropertyOptional({ type: () => EmpleadoResponseDto })
  empleado?: EmpleadoResponseDto;

  @ApiPropertyOptional({ type: () => MenuComedorResponseDto })
  menu?: MenuComedorResponseDto;

  @ApiPropertyOptional({
    type: () => SolicitudComedorDetalleResponseDto,
    isArray: true,
  })
  detalles?: SolicitudComedorDetalleResponseDto[];
}
