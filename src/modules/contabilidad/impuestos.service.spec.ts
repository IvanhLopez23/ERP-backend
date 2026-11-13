import { BadRequestException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { ImpuestosService } from './impuestos.service';
import { DeclaracionIva } from './entities/declaracion-iva.entity';
import type { ReportesContablesService } from './reportes-contables.service';
import type { CuentasService } from './cuentas.service';
import type { IntegracionContableService } from './integracion-contable.service';

describe('ImpuestosService', () => {
  const declaracionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity === DeclaracionIva) return declaracionRepository;
      return {};
    }),
  };
  const dataSource = {
    transaction: jest.fn((callback: any) => callback(manager)),
    getRepository: jest.fn((entity) => {
      if (entity === DeclaracionIva) return declaracionRepository;
      return {};
    }),
  };
  const reportesContablesService = { iva: jest.fn() };
  const cuentasService = {
    buscarPorCodigo: jest.fn(),
    buscarPorId: jest.fn(),
  };
  const integracionContableService = {
    registrarDeclaracionIva: jest.fn(),
  };

  let service: ImpuestosService;

  const reporteBase = {
    desde: '2026-11-01',
    hasta: '2026-11-30',
    trasladado: 160,
    acreditable: 80,
    neto: 80,
    porPagar: 80,
    saldoFavor: 0,
    movimientos: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reportesContablesService.iva.mockResolvedValue(reporteBase);
    cuentasService.buscarPorCodigo.mockResolvedValue({
      id: 2,
      codigo: '1102',
      tipo: 'activo',
      activo: true,
      permiteMovimientos: true,
    });
    integracionContableService.registrarDeclaracionIva.mockResolvedValue({
      id: 50,
    });
    declaracionRepository.create.mockImplementation((data) => ({ ...data }));
    declaracionRepository.save.mockImplementation((data) => ({
      id: 1,
      ...data,
    }));
    declaracionRepository.find.mockResolvedValue([]);

    service = new ImpuestosService(
      dataSource as unknown as DataSource,
      reportesContablesService as unknown as ReportesContablesService,
      cuentasService as unknown as CuentasService,
      integracionContableService as unknown as IntegracionContableService,
    );
  });

  it('declara el IVA y genera la póliza de pago', async () => {
    declaracionRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 1,
        publicId: 'declaracion-1',
        anio: 2026,
        mes: 11,
        poliza: { id: 50, publicId: 'poliza-50', folio: 'POL-1' },
      });

    const resultado = await service.declarar({ anio: 2026, mes: 11 }, 1);

    expect(
      integracionContableService.registrarDeclaracionIva,
    ).toHaveBeenCalledWith(
      expect.any(String),
      2026,
      11,
      160,
      80,
      '1102',
      1,
      manager,
    );
    expect(declaracionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        anio: 2026,
        mes: 11,
        trasladado: 160,
        acreditable: 80,
        neto: 80,
        porPagar: 80,
        saldoFavor: 0,
        estatus: 'pagada',
        polizaId: 50,
        usuarioId: 1,
      }),
    );
    expect(resultado).toEqual(
      expect.objectContaining({ publicId: 'declaracion-1' }),
    );
  });

  it('registra una declaración con saldo a favor sin póliza', async () => {
    reportesContablesService.iva.mockResolvedValue({
      ...reporteBase,
      trasladado: 0,
      acreditable: 50,
      neto: -50,
      porPagar: 0,
      saldoFavor: 50,
    });
    integracionContableService.registrarDeclaracionIva.mockResolvedValue(null);
    declaracionRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 2,
        publicId: 'declaracion-2',
        anio: 2026,
        mes: 10,
        poliza: null,
      });

    await service.declarar({ anio: 2026, mes: 10 }, 1);

    expect(declaracionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estatus: 'declarada',
        polizaId: null,
        porPagar: 0,
        saldoFavor: 50,
      }),
    );
  });

  it('rechaza declarar dos veces el mismo periodo', async () => {
    declaracionRepository.findOne.mockResolvedValueOnce({
      id: 1,
      anio: 2026,
      mes: 11,
    });

    await expect(service.declarar({ anio: 2026, mes: 11 }, 1)).rejects.toThrow(
      BadRequestException,
    );

    expect(declaracionRepository.save).not.toHaveBeenCalled();
    expect(
      integracionContableService.registrarDeclaracionIva,
    ).not.toHaveBeenCalled();
  });

  it('rechaza un periodo sin movimientos de IVA', async () => {
    reportesContablesService.iva.mockResolvedValue({
      ...reporteBase,
      trasladado: 0,
      acreditable: 0,
      neto: 0,
      porPagar: 0,
      saldoFavor: 0,
    });

    await expect(service.declarar({ anio: 2026, mes: 9 }, 1)).rejects.toThrow(
      BadRequestException,
    );

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
