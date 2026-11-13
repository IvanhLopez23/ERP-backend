import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnviarMensajeDto {
  @ApiProperty({
    description: 'Contenido del mensaje',
    example: 'Hola, ¿cómo estás?',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  contenido: string;
}
