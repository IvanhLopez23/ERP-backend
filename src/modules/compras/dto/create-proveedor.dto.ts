import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({
    description: 'Código único del proveedor',
    example: 'PROV-001',
  })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({
    description: 'Nombre del proveedor',
    example: 'Distribuidora de Tecnología S.A. de C.V.',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    description: 'RFC del proveedor',
    example: 'DTE201201ABC',
  })
  @IsString()
  @IsOptional()
  rfc?: string;

  @ApiPropertyOptional({
    description: 'Dirección del proveedor',
    example: 'Av. Reforma #456, Col. Juárez',
  })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del proveedor',
    example: '5551234567',
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico del proveedor',
    example: 'contacto@distribuidora.com',
  })
  @IsEmail()
  @IsOptional()
  correo?: string;
}
