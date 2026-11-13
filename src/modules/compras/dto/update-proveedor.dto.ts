import { PartialType } from '@nestjs/swagger';
import { CreateProveedorDto } from './create-proveedor.dto';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {
  @ApiPropertyOptional({ description: 'Código único del proveedor' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiPropertyOptional({ description: 'Nombre del proveedor' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'RFC del proveedor' })
  @IsString()
  @IsOptional()
  rfc?: string;

  @ApiPropertyOptional({ description: 'Dirección del proveedor' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ description: 'Teléfono del proveedor' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico del proveedor' })
  @IsEmail()
  @IsOptional()
  correo?: string;
}
