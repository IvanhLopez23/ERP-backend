import { BadRequestException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { NominaService } from './nomina.service';
import { Nomina } from './entities/nomina.entity';
import { NominaDetalle } from './entities/nomina-detalle.entity';
import { Empleado } from '../rh/entities/empleado.entity';
import type { IntegracionContableService } from './integracion-contable.service';

describe('NominaService', () => {
  const nominaRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const detalleRepository = {
    find: jest.fn(),
  };
  const empleadoRepository = {
    find: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };
  const integracionContableService = {
    registrarNomina: jest.fn(),
  };

  let service: NominaService;

  const empleado = {
    id: 1,
    publicId: 'emp-1',
    codigo: 'EMP-001',
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'López',
    salario: 10000,
    centroCostoId: 5,
    centroCosto: { codigo: 'CC-ADMIN', nombre: 'Administración' },
  } as unknown as Empleado;

  const nominaCompleta = {
    id: 99,
    publicId: 'nomina-1',
    anio: 2026,
    mes: 11,
    fecha: '2026-11-30',
    estatus: 'contabilizada',
    totalPercepciones: 10000,
    totalIsr: 1000,
    totalImss: 200,
    totalOtrasDeducciones: 0,
    totalNeto: 8800,
    imssPatronal: 1200,
    provisionPrestaciones: 800,
    poliza: { publicId: 'poliza-1', folio: 'POL-202611-0001' },
    detalles: [
      {
        publicId: 'detalle-1',
        centroCostoId: 5,
        salarioBase: 10000,
        percepciones: 10000,
        isr: 1000,
        imss: 200,
        otrasDeducciones: 0,
        neto: 8800,
        empleado,
        centroCosto: { codigo: 'CC-ADMIN', nombre: 'Administración' },
      },
    ],
  } as unknown as Nomina;

  beforeEach(() => {
    jest.clearAllMocks();
    nominaRepository.findOne.mockResolvedValue(null);
    nominaRepository.find.mockResolvedValue([]);
    empleadoRepository.find.mockResolvedValue([empleado]);

    const nominaRepo = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn((data) => Promise.resolve({ id: 99, ...data })),
    };
    const detalleRepo = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn((data) => Promise.resolve(data)),
    };
    manager.getRepository.mockImplementation((entidad: unknown) =>
      entidad === Nomina ? nominaRepo : detalleRepo,
    );
    dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
      cb(manager),
    );
    integracionContableService.registrarNomina.mockResolvedValue({ id: 10 });

    service = new NominaService(
      nominaRepository as unknown as Repository<Nomina>,
      detalleRepository as unknown as Repository<NominaDetalle>,
      empleadoRepository as unknown as Repository<Empleado>,
      dataSource as unknown as DataSource,
      integracionContableService as unknown as IntegracionContableService,
    );
  });

  it('previsualiza a los empleados activos con su salario', async () => {
    const resultado = await service.preview({ anio: 2026, mes: 11 });

    expect(resultado.anio).toBe(2026);
    expect(resultado.mes).toBe(11);
    expect(resultado.empleados).toHaveLength(1);
    expect(resultado.empleados[0]).toEqual(
      expect.objectContaining({
        publicId: 'emp-1',
        centroCosto: 'CC-ADMIN',
        salarioBase: 10000,
        percepciones: 10000,
        neto: 10000,
      }),
    );
    expect(resultado.totales).toEqual(
      expect.objectContaining({ percepciones: 10000, neto: 10000 }),
    );
  });

  it('contabiliza la nómina con póliza y detalles en una transacción', async () => {
    nominaRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(nominaCompleta);

    const resultado = await service.crear(
      {
        anio: 2026,
        mes: 11,
        fecha: '2026-11-30',
        imssPatronal: 1200,
        provisionPrestaciones: 800,
        empleados: [
          {
            empleadoId: 'emp-1',
            percepciones: 10000,
            isr: 1000,
            imss: 200,
          },
        ],
      },
      7,
    );

    expect(integracionContableService.registrarNomina).toHaveBeenCalledWith(
      '2026-11-30',
      2026,
      11,
      [{ centroCostoId: 5, monto: 10000 }],
      1000,
      200,
      8800,
      1200,
      800,
      7,
      manager,
    );
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual(
      expect.objectContaining({
        publicId: 'nomina-1',
        totalNeto: 8800,
        porCentro: [
          expect.objectContaining({ codigo: 'CC-ADMIN', neto: 8800 }),
        ],
      }),
    );
    expect(resultado.poliza).toEqual({
      publicId: 'poliza-1',
      folio: 'POL-202611-0001',
    });
  });

  it('rechaza una nómina duplicada del mismo periodo', async () => {
    nominaRepository.findOne.mockResolvedValue({ id: 1 });

    await expect(service.crear({ anio: 2026, mes: 11 }, 7)).rejects.toThrow(
      BadRequestException,
    );

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rechaza un neto negativo', async () => {
    await expect(
      service.crear(
        {
          anio: 2026,
          mes: 11,
          empleados: [{ empleadoId: 'emp-1', isr: 20000 }],
        },
        7,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
