import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'El nombre de usuario para iniciar sesión',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  nombreUsuario: string;

  @ApiProperty({
    description: 'La contraseña de la cuenta',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  contrasena: string;
}
