import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEmpleadoDto } from './create-empleado.dto';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdateEmpleadoDto extends PartialType(
  OmitType(CreateEmpleadoDto, [
    'tipoContrato',
    'fechaInicioContrato',
    'fechaFinContrato',
    'salarioContrato',
  ] as const),
) {
  @ApiPropertyOptional({ description: 'Código único del empleado' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  codigo?: string;

  @ApiPropertyOptional({ description: 'publicId del usuario asociado' })
  @IsOptional()
  @IsPublicId()
  usuarioId?: string;

  @ApiPropertyOptional({ description: 'Nombre del empleado' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Apellido paterno' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  apellidoPaterno?: string;

  @ApiPropertyOptional({ description: 'Apellido materno' })
  @IsString()
  @IsOptional()
  apellidoMaterno?: string;

  @ApiPropertyOptional({ description: 'Género (M/F)' })
  @IsString()
  @IsOptional()
  genero?: string;

  @ApiPropertyOptional({ description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ description: 'RFC' })
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

  @ApiPropertyOptional({ description: 'Teléfono' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico' })
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

  @ApiPropertyOptional({ description: 'ID del departamento' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  departamentoId?: string;

  @ApiPropertyOptional({ description: 'ID del puesto' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  puestoId?: string;

  @ApiPropertyOptional({ description: 'ID del turno' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  turnoId?: string;

  @ApiPropertyOptional({ description: 'Fecha de ingreso (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  fechaIngreso?: string;

  @ApiPropertyOptional({
    description: 'publicId del centro de costo del empleado',
  })
  @IsPublicId()
  @IsOptional()
  centroCostoId?: string;
}
