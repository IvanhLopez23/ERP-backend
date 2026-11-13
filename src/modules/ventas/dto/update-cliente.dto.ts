import { PartialType } from '@nestjs/swagger';
import { CreateClienteDto } from './create-cliente.dto';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsEmail,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {
  @ApiPropertyOptional({ description: 'Código único del cliente' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiPropertyOptional({ description: 'Nombre del cliente' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Tipo' })
  @IsString()
  @IsOptional()
  @IsIn(['cliente', 'prospecto'])
  tipo?: string;

  @ApiPropertyOptional({ description: 'RFC' })
  @IsString()
  @IsOptional()
  rfc?: string;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ description: 'Teléfono' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico' })
  @IsEmail()
  @IsOptional()
  correo?: string;
}
