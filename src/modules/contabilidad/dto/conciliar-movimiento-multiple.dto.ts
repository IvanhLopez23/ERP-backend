import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class AplicacionConciliacionDto {
  @ApiProperty({ description: 'publicId del detalle de póliza' })
  @IsPublicId()
  @IsNotEmpty()
  polizaDetalleId: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;
}

export class ConciliarMovimientoMultipleDto {
  @ApiProperty({ type: [AplicacionConciliacionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AplicacionConciliacionDto)
  aplicaciones: AplicacionConciliacionDto[];
}
