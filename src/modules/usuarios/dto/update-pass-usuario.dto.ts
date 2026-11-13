import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePassUsuarioDto {
  @ApiProperty({
    description: 'Nueva contraseña',
    example: '1234',
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  contrasena: string;
}
