import {
  IsIn,
  IsInt,
  IsMilitaryTime,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PATRON_DIAS_LABORABLES,
  PERIODICIDADES_TURNO,
} from './create-turno.dto';

export class UpdateTurnoDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @IsIn([...PERIODICIDADES_TURNO])
  @IsOptional()
  periodicidad?: string;

  @IsMilitaryTime()
  @IsOptional()
  horaEntrada?: string;

  @IsMilitaryTime()
  @IsOptional()
  horaSalida?: string;

  @IsMilitaryTime()
  @IsOptional()
  horaComidaInicio?: string;

  @IsMilitaryTime()
  @IsOptional()
  horaComidaFin?: string;

  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  toleranciaMinutos?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(PATRON_DIAS_LABORABLES, {
    message: 'Los días laborables deben usar L, M, X, J, V, S, D',
  })
  diasLaborables?: string;
}
