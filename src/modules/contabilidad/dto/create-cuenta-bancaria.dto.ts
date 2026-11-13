import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateCuentaBancariaDto {
  @ApiProperty({ example: 'Cuenta operativa BBVA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiProperty({ example: 'BBVA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  banco: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  numeroCuenta?: string;

  @ApiPropertyOptional({ example: '012180001234567890' })
  @IsString()
  @IsOptional()
  @Length(18, 18)
  clabe?: string;

  @ApiPropertyOptional({ example: 'MXN', default: 'MXN' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  moneda?: string;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  saldoInicial?: number;

  @ApiPropertyOptional({
    description: 'publicId de la cuenta contable. Default: 1102 Bancos',
  })
  @IsPublicId()
  @IsOptional()
  cuentaContableId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
