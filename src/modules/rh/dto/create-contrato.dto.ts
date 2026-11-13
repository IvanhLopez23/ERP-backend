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

export class CreateContratoDto {
  @ApiProperty({
    description: 'publicId del empleado',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  empleadoId: string;

  @ApiProperty({
    description: 'Tipo de contrato',
    example: 'indeterminado',
    enum: ['indeterminado', 'temporal', 'obra'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['indeterminado', 'temporal', 'obra'])
  tipo: string;

  @ApiProperty({
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaFin?: string;

  @ApiPropertyOptional({ description: 'Salario del contrato', example: 25000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salario?: number;
}
