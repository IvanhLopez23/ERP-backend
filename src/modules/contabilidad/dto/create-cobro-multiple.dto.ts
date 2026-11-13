import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';
import { METODOS_PAGO } from './create-cobro.dto';

export class AplicacionCobroDto {
  @ApiProperty({ description: 'publicId de la cuenta por cobrar' })
  @IsPublicId()
  cuentaId: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;
}

export class CreateCobroMultipleDto {
  @ApiProperty({ example: '2026-11-10' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ enum: [...METODOS_PAGO], example: 'transferencia' })
  @IsIn([...METODOS_PAGO])
  metodoPago: string;

  @ApiPropertyOptional({ example: 'SPEI-123' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referencia?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({
    type: [AplicacionCobroDto],
    description: 'Distribución del cobro entre una o más CxC',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AplicacionCobroDto)
  aplicaciones: AplicacionCobroDto[];
}
