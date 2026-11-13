import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateAsistenciaDto {
  @ApiProperty({
    description: 'publicId del empleado',
    example: '01a0b13f-fe4a-7349-89e7-735ad44932f1',
  })
  @IsPublicId()
  @IsNotEmpty()
  empleadoId: string;

  @ApiProperty({ description: 'Fecha (YYYY-MM-DD)', example: '2024-01-15' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener el formato YYYY-MM-DD',
  })
  fecha: string;

  @ApiPropertyOptional({
    description: 'Hora de entrada (HH:mm)',
    example: '08:00',
  })
  @IsString()
  @IsOptional()
  horaEntrada?: string;

  @ApiPropertyOptional({
    description: 'Hora de salida (HH:mm)',
    example: '17:00',
  })
  @IsString()
  @IsOptional()
  horaSalida?: string;

  @ApiProperty({
    description: 'Estatus',
    example: 'presente',
    enum: ['presente', 'ausente', 'permiso', 'vacaciones'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['presente', 'ausente', 'permiso', 'vacaciones'])
  estatus: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
