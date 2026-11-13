import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateMovimientoRefaccionDto {
  @ApiProperty({
    description: 'publicId de la refacción',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsNotEmpty()
  @IsPublicId()
  refaccionId: string;

  @ApiPropertyOptional({
    description: 'publicId de la orden de trabajo relacionada',
  })
  @IsOptional()
  @IsPublicId()
  ordenTrabajoId?: string;

  @ApiProperty({ description: 'Cantidad', example: 2 })
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @ApiProperty({
    description: 'Tipo de movimiento',
    example: 'salida',
    enum: ['entrada', 'salida', 'ajuste'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['entrada', 'salida', 'ajuste'])
  tipo: string;

  @ApiPropertyOptional({ description: 'Observaciones del movimiento' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
