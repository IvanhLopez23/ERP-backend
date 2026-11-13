import { IsBoolean, IsInt, IsString } from 'class-validator';

export class CreateBitacoraAccesoDto {
  @IsInt()
  usuarioId: number;

  @IsString()
  descripcion: string;

  @IsBoolean()
  acceso: boolean;
}
