import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateSolicitudPermisoDto {
  @ApiProperty({
    description: 'publicId del empleado',
    example: '01a0b13f-fe4a-7349-89e7-735ad44932f1',
  })
  @IsPublicId()
  @IsNotEmpty()
  empleadoId: string;

  @ApiProperty({
    description: 'Tipo de permiso',
    example: 'vacaciones',
    enum: ['enfermedad', 'personal', 'vacaciones', 'otro'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['enfermedad', 'personal', 'vacaciones', 'otro'])
  tipo: string;

  @ApiProperty({
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2026-10-01',
  })
  @IsString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiProperty({
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2026-10-03',
  })
  @IsString()
  @IsNotEmpty()
  fechaFin: string;

  @ApiProperty({ description: 'Motivo del permiso', example: 'Vacaciones' })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({
    description:
      'Ruta del comprobante (comprobante médico o carta de vacaciones firmada)',
    example: '/uploads/permisos/uuid.pdf',
  })
  @IsString()
  @IsOptional()
  comprobante?: string;
}
