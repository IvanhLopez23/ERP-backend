import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductoResponseDto } from './producto.response.dto';
import { AlmacenResponseDto } from './almacen.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class MovimientoInventarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'entrada' })
  tipo: string;

  @ApiProperty({ example: 10.5 })
  cantidad: number;

  @ApiProperty({ example: 5 })
  existenciaAnterior: number;

  @ApiProperty({ example: 15.5 })
  existenciaNueva: number;

  @ApiPropertyOptional({ example: 'OC-001' })
  referencia?: string;

  @ApiPropertyOptional({ example: 'Entrada por compra' })
  observaciones?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiPropertyOptional({ type: () => ProductoResponseDto })
  producto?: ProductoResponseDto;

  @ApiPropertyOptional({ type: () => AlmacenResponseDto })
  almacen?: AlmacenResponseDto;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;
}
