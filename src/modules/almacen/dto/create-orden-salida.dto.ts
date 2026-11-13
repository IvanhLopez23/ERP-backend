import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';
import { CreateDetalleSalidaDto } from './create-detalle-salida.dto';

export class CreateOrdenSalidaDto {
  @ApiProperty({ description: 'publicId del almacén de origen' })
  @IsPublicId()
  @IsNotEmpty()
  almacenId: string;

  @ApiProperty({ example: '2026-11-13' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de salida debe tener el formato YYYY-MM-DD',
  })
  fechaSalida: string;

  @ApiProperty({ example: 'Salida a producción' })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({ example: 'Entrega parcial' })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ type: [CreateDetalleSalidaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleSalidaDto)
  detalles: CreateDetalleSalidaDto[];
}
