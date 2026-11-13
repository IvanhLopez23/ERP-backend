import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiPropertyOptional({
    description: 'Nueva descripción para el rol',
    example: 'Administrador de Sistemas',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
