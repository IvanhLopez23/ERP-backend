import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEmail,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export const TIPOS_CONTRATO = ['indeterminado', 'temporal', 'obra'] as const;

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class CreateEmpleadoDto {
  @ApiProperty({ description: 'Código único del empleado', example: 'EMP-001' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiPropertyOptional({
    description: 'publicId del usuario asociado (opcional)',
  })
  @IsOptional()
  @IsPublicId()
  usuarioId?: string;

  @ApiProperty({ description: 'Nombre del empleado', example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Apellido paterno', example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  apellidoPaterno: string;

  @ApiPropertyOptional({ description: 'Apellido materno' })
  @IsString()
  @IsOptional()
  apellidoMaterno?: string;

  @ApiPropertyOptional({ description: 'Género (M/F)', example: 'M' })
  @IsString()
  @IsOptional()
  genero?: string;

  @ApiPropertyOptional({ description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ description: 'RFC', example: 'PEAJ900101ABC' })
  @IsString()
  @IsOptional()
  rfc?: string;

  @ApiPropertyOptional({ description: 'CURP' })
  @IsString()
  @IsOptional()
  curp?: string;

  @ApiPropertyOptional({ description: 'NSS' })
  @IsString()
  @IsOptional()
  nss?: string;

  @ApiPropertyOptional({ description: 'Teléfono', example: '5551234567' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan@empresa.com',
  })
  @IsEmail()
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ description: 'URL de la foto' })
  @IsString()
  @IsOptional()
  foto?: string;

  @ApiProperty({ description: 'ID del departamento' })
  @IsString()
  @IsNotEmpty()
  departamentoId: string;

  @ApiProperty({ description: 'ID del puesto' })
  @IsString()
  @IsNotEmpty()
  puestoId: string;

  @ApiPropertyOptional({ description: 'Turno del empleado (publicId)' })
  @IsString()
  @IsOptional()
  turnoId?: string;

  @ApiProperty({
    description: 'Fecha de ingreso (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(PATRON_FECHA, {
    message: 'La fecha de ingreso debe tener el formato YYYY-MM-DD',
  })
  fechaIngreso: string;

  @ApiProperty({
    description: 'Tipo del contrato inicial',
    enum: [...TIPOS_CONTRATO],
    example: 'indeterminado',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([...TIPOS_CONTRATO])
  tipoContrato: string;

  @ApiProperty({
    description: 'Fecha de inicio del contrato (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(PATRON_FECHA, {
    message: 'La fecha de inicio del contrato debe tener el formato YYYY-MM-DD',
  })
  fechaInicioContrato: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del contrato (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  @Matches(PATRON_FECHA, {
    message: 'La fecha de fin del contrato debe tener el formato YYYY-MM-DD',
  })
  fechaFinContrato?: string;

  @ApiProperty({
    description:
      'Salario del contrato. El salario del empleado se toma de este valor.',
    example: 25000,
  })
  @IsNumber()
  @Min(0.01)
  salarioContrato: number;

  @ApiPropertyOptional({
    description: 'publicId del centro de costo del empleado',
  })
  @IsPublicId()
  @IsOptional()
  centroCostoId?: string;
}
