import { BadRequestException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { PolizasService } from './polizas.service';
import { Poliza } from './entities/poliza.entity';
import { PolizaDetalle } from './entities/poliza-detalle.entity';
import { CuentaContable } from './entities/cuenta-contable.entity';
import type { PeriodosService } from './periodos.service';
import type { FoliosService } from './folios.service';

const CUENTA_1 = '0199a000-0000-7000-8000-000000000001';
const CUENTA_2 = '0199a000-0000-7000-8000-000000000002';

describe('PolizasService', () => {
  const polizaRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const polizaManager = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const detalleManager = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const cuentaManager = {
    find: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity === Poliza) return polizaManager;
      if (entity === PolizaDetalle) return detalleManager;
      if (entity === CuentaContable) return cuentaManager;
      return {};
    }),
  };
  const dataSource = {
    transaction: jest.fn((callback: any) => callback(manager)),
  };
  const periodosService = {
    obtenerPeriodoParaFecha: jest.fn(),
    buscarPorIdInterno: jest.fn(),
  };
  const foliosService = { siguiente: jest.fn() };

  let service: PolizasService;

  const dto = (debe: number, haber: number) => ({
    fecha: '2026-11-10',
    tipo: 'diario',
    concepto: 'Aporte de capital',
    detalles: [
      { cuentaId: CUENTA_1, debe, haber: 0 },
      { cuentaId: CUENTA_2, debe: 0, haber },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    periodosService.obtenerPeriodoParaFecha.mockResolvedValue({
      id: 5,
      anio: 2026,
      mes: 11,
      estatus: 'abierto',
    });
    polizaManager.count.mockResolvedValue(0);
    foliosService.siguiente.mockResolvedValue(1);
    polizaManager.create.mockImplementation((data) => ({ ...data }));
    polizaManager.save.mockImplementation((data) => ({ id: 1, ...data }));
    detalleManager.create.mockImplementation((data) => ({ ...data }));
    detalleManager.save.mockResolvedValue([]);
    cuentaManager.find.mockResolvedValue([
      {
        id: 10,
        publicId: CUENTA_1,
        codigo: '1101',
        activo: true,
        permiteMovimientos: true,
      },
      {
        id: 20,
        publicId: CUENTA_2,
        codigo: '3101',
        activo: true,
        permiteMovimientos: true,
      },
    ]);
    polizaRepository.findOne.mockResolvedValue({
      id: 1,
      publicId: 'poliza-public',
      detalles: [],
    });
    polizaRepository.update.mockResolvedValue(undefined);

    service = new PolizasService(
      polizaRepository as unknown as Repository<Poliza>,
      {} as Repository<PolizaDetalle>,
      dataSource as unknown as DataSource,
      periodosService as unknown as PeriodosService,
      foliosService as unknown as FoliosService,
    );
  });

  it('crea una póliza cuadrada con folio y totales', async () => {
    const resultado = await service.crear(dto(100, 100), 1);

    expect(polizaManager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        folio: 'POL-202611-0001',
        totalDebe: 100,
        totalHaber: 100,
        estatus: 'borrador',
      }),
    );
    expect(detalleManager.save).toHaveBeenCalled();
    expect(resultado).toEqual(
      expect.objectContaining({ publicId: 'poliza-public' }),
    );
  });

  it('rechaza una póliza descuadrada', async () => {
    await expect(service.crear(dto(100, 90), 1)).rejects.toThrow(
      BadRequestException,
    );
    expect(polizaManager.save).not.toHaveBeenCalled();
  });

  it('rechaza crear en un periodo cerrado', async () => {
    periodosService.obtenerPeriodoParaFecha.mockRejectedValue(
      new BadRequestException('El periodo está cerrado'),
    );

    await expect(service.crear(dto(100, 100), 1)).rejects.toThrow(
      BadRequestException,
    );
    expect(polizaManager.save).not.toHaveBeenCalled();
  });

  it('rechaza cuentas que no permiten movimientos', async () => {
    cuentaManager.find.mockResolvedValue([
      {
        id: 10,
        publicId: CUENTA_1,
        codigo: '1100',
        activo: true,
        permiteMovimientos: false,
      },
      {
        id: 20,
        publicId: CUENTA_2,
        codigo: '3101',
        activo: true,
        permiteMovimientos: true,
      },
    ]);

    await expect(service.crear(dto(100, 100), 1)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('no contabiliza una póliza si el periodo está cerrado', async () => {
    polizaRepository.findOne.mockResolvedValue({
      id: 1,
      publicId: 'poliza-public',
      estatus: 'borrador',
      periodoId: 5,
    });
    periodosService.buscarPorIdInterno.mockResolvedValue({
      estatus: 'cerrado',
    });

    await expect(service.contabilizar('poliza-public')).rejects.toThrow(
      BadRequestException,
    );
    expect(polizaRepository.update).not.toHaveBeenCalled();
  });

  it('contabiliza una póliza en un periodo abierto', async () => {
    polizaRepository.findOne.mockResolvedValue({
      id: 1,
      publicId: 'poliza-public',
      estatus: 'borrador',
      periodoId: 5,
    });
    periodosService.buscarPorIdInterno.mockResolvedValue({
      estatus: 'abierto',
    });

    await service.contabilizar('poliza-public');

    expect(polizaRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ estatus: 'contabilizada' }),
    );
  });
});
