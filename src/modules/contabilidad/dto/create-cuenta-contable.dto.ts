import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';
import { NATURALEZAS_CUENTA, TIPOS_CUENTA } from '../contabilidad.constants';

export class CreateCuentaContableDto {
  @ApiProperty({ example: '1101', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @ApiProperty({ example: 'Caja' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({ example: 'Efectivo en caja' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: [...TIPOS_CUENTA], example: 'activo' })
  @IsIn([...TIPOS_CUENTA])
  tipo: string;

  @ApiPropertyOptional({
    enum: [...NATURALEZAS_CUENTA],
    description: 'Si no se envía, se deriva del tipo de cuenta',
  })
  @IsIn([...NATURALEZAS_CUENTA])
  @IsOptional()
  naturaleza?: string;

  @ApiPropertyOptional({ description: 'publicId de la cuenta padre' })
  @IsPublicId()
  @IsOptional()
  padreId?: string;

  @ApiPropertyOptional({
    description:
      'Solo las cuentas que permiten movimientos pueden usarse en pólizas',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  permiteMovimientos?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
