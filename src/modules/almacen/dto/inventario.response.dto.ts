import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductoResponseDto } from './producto.response.dto';
import { AlmacenResponseDto } from './almacen.response.dto';

export class InventarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 10.5 })
  existencia: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => ProductoResponseDto })
  producto?: ProductoResponseDto;

  @ApiPropertyOptional({ type: () => AlmacenResponseDto })
  almacen?: AlmacenResponseDto;
}
