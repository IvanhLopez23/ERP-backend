import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReporteContableQueryDto } from './reporte-contable.query.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class AuxiliarClientesQueryDto extends ReporteContableQueryDto {
  @ApiPropertyOptional({
    description:
      'publicId del cliente. Si se omite, devuelve el resumen por cliente.',
  })
  @IsPublicId()
  @IsOptional()
  clienteId?: string;
}

export class AuxiliarProveedoresQueryDto extends ReporteContableQueryDto {
  @ApiPropertyOptional({
    description:
      'publicId del proveedor. Si se omite, devuelve el resumen por proveedor.',
  })
  @IsPublicId()
  @IsOptional()
  proveedorId?: string;
}
