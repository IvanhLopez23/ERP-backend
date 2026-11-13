import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsMilitaryTime,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PERIODICIDADES_TURNO = [
  'semanal',
  'quincenal',
  'mensual',
] as const;

export const DIAS_LABORABLES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

export const PATRON_DIAS_LABORABLES =
  /^(L|M|X|J|V|S|D)(,(L|M|X|J|V|S|D))*$/;

export class CreateTurnoDto {
  @ApiProperty({ example: 'Turno matutino' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ enum: [...PERIODICIDADES_TURNO] })
  @IsIn([...PERIODICIDADES_TURNO])
  @IsNotEmpty()
  periodicidad: string;

  @ApiProperty({ example: '09:00', description: 'Hora de entrada (HH:mm)' })
  @IsMilitaryTime()
  horaEntrada: string;

  @ApiProperty({ example: '18:00', description: 'Hora de salida (HH:mm)' })
  @IsMilitaryTime()
  horaSalida: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsMilitaryTime()
  @IsOptional()
  horaComidaInicio?: string;

  @ApiPropertyOptional({ example: '15:00' })
  @IsMilitaryTime()
  @IsOptional()
  horaComidaFin?: string;

  @ApiProperty({ example: 10, description: 'Minutos de tolerancia' })
  @IsInt()
  @Min(0)
  @Max(120)
  toleranciaMinutos: number;

  @ApiProperty({
    example: 'L,M,X,J,V',
    description: 'Días laborables: L M X J V S D separados por coma',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(PATRON_DIAS_LABORABLES, {
    message: 'Los días laborables deben usar L, M, X, J, V, S, D',
  })
  diasLaborables: string;
}
