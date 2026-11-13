import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreatePolizaDetalleDto {
  @ApiProperty({ description: 'publicId de la cuenta contable' })
  @IsPublicId()
  @IsNotEmpty()
  cuentaId: string;

  @ApiPropertyOptional({
    description: 'publicId del centro de costo/área/proyecto para este detalle',
  })
  @IsPublicId()
  @IsOptional()
  centroCostoId?: string;

  @ApiPropertyOptional({ example: 'Cargo a clientes' })
  @IsString()
  @IsOptional()
  concepto?: string;

  @ApiPropertyOptional({ example: 1000, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  debe?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  haber?: number;

  @ApiPropertyOptional({ example: 'FAC-001' })
  @IsString()
  @IsOptional()
  referencia?: string;
}
