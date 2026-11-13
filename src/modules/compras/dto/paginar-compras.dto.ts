// paginar-compras.dto.ts
import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto'; // ajusta tu ruta
import { IsPublicId } from '../../../common/validation/public-id';

export class PaginarComprasDto extends PaginacionDto {
  @ApiPropertyOptional({ description: 'publicId del proveedor' })
  @IsOptional()
  @IsPublicId()
  proveedorId?: string;
}
