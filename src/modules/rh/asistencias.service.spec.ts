import { AsistenciasService } from './asistencias.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { Turno } from './entities/turno.entity';

function servicio() {
  return new AsistenciasService(
    null as never,
    null as never,
    null as never,
  );
}

function turno(parcial: Partial<Turno> = {}): Turno {
  return {
    id: 1,
    nombre: 'Turno de prueba',
    periodicidad: 'semanal',
    horaEntrada: '09:00',
    horaSalida: '18:00',
    horaComidaInicio: '14:00',
    horaComidaFin: '15:00',
    toleranciaMinutos: 10,
    diasLaborables: 'L,M,X,J,V',
    ...parcial,
  } as Turno;
}

function asistencia(parcial: Partial<CreateAsistenciaDto> = {}) {
  return {
    empleadoId: 'empleado',
    fecha: '2026-11-12', // jueves
    estatus: 'presente',
    horaEntrada: '09:20',
    horaSalida: '17:40',
    ...parcial,
  } as CreateAsistenciaDto;
}

describe('AsistenciasService.calcularHorario', () => {
  it('calcula retardo, salida anticipada y horas descontando comida', () => {
    const resultado = servicio().calcularHorario(asistencia(), turno());

    expect(resultado.retardoMinutos).toBe(10);
    expect(resultado.salidaAnticipadaMinutos).toBe(20);
    expect(resultado.horasTrabajadas).toBe(7.33);
    expect(resultado.turnoId).toBe(1);
  });

  it('respeta la tolerancia del turno', () => {
    const resultado = servicio().calcularHorario(
      asistencia({ horaEntrada: '09:05' }),
      turno(),
    );

    expect(resultado.retardoMinutos).toBe(0);
  });

  it('no marca retardo en un día no laborable', () => {
    const resultado = servicio().calcularHorario(
      asistencia({ fecha: '2026-11-14' }), // sábado
      turno(),
    );

    expect(resultado.retardoMinutos).toBe(0);
    expect(resultado.salidaAnticipadaMinutos).toBe(0);
  });

  it('soporta turnos que cruzan la medianoche', () => {
    const resultado = servicio().calcularHorario(
      asistencia({ horaEntrada: '22:10', horaSalida: '05:30' }),
      turno({
        horaEntrada: '22:00',
        horaSalida: '06:00',
        horaComidaInicio: null,
        horaComidaFin: null,
        toleranciaMinutos: 5,
      }),
    );

    expect(resultado.retardoMinutos).toBe(5);
    expect(resultado.salidaAnticipadaMinutos).toBe(30);
    expect(resultado.horasTrabajadas).toBe(7.33);
  });

  it('no calcula nada cuando el estatus no es presente', () => {
    const resultado = servicio().calcularHorario(
      asistencia({ estatus: 'ausente' }),
      turno(),
    );

    expect(resultado.retardoMinutos).toBe(0);
    expect(resultado.salidaAnticipadaMinutos).toBe(0);
    expect(resultado.horasTrabajadas).toBeNull();
  });

  it('deja las horas en null si no hay turno', () => {
    const resultado = servicio().calcularHorario(asistencia(), null);

    expect(resultado.turnoId).toBeNull();
    expect(resultado.horasTrabajadas).toBeNull();
  });
});
