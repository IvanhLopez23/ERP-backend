import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({ description: 'Código único del cliente', example: 'CLI-001' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Empresa XYZ S.A. de C.V.',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    description: 'Tipo',
    example: 'cliente',
    enum: ['cliente', 'prospecto'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['cliente', 'prospecto'])
  tipo?: string;

  @ApiPropertyOptional({ description: 'RFC', example: 'XYZ201201ABC' })
  @IsString()
  @IsOptional()
  rfc?: string;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ description: 'Teléfono', example: '5551234567' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'contacto@empresa.com',
  })
  @IsEmail()
  @IsOptional()
  correo?: string;
}
