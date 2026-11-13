import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SolicitudComedorResponseDto } from './solicitud-comedor.response.dto';
import { MenuComedorItemResponseDto } from './menu-comedor-item.response.dto';

export class SolicitudComedorDetalleResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiPropertyOptional({ type: () => SolicitudComedorResponseDto })
  solicitud?: SolicitudComedorResponseDto;

  @ApiPropertyOptional({ type: () => MenuComedorItemResponseDto })
  menuItem?: MenuComedorItemResponseDto;
}
