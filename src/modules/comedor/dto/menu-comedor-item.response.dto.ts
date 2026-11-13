import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuComedorResponseDto } from './menu-comedor.response.dto';

export class MenuComedorItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: '2024-01-01' })
  fecha: Date;

  @ApiProperty({ example: 'desayuno' })
  tipoComida: string;

  @ApiProperty({ example: 'Huevos a la mexicana, frijoles y café' })
  descripcion: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiPropertyOptional({ type: () => MenuComedorResponseDto })
  menu?: MenuComedorResponseDto;
}
