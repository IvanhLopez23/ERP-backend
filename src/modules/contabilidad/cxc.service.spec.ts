import { BadRequestException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { Venta } from '../ventas/entities/venta.entity';
import { Cliente } from '../ventas/entities/cliente.entity';
import { CxcService } from './cxc.service';
import { CuentaPorCobrar } from './entities/cuenta-por-cobrar.entity';
import { CobroCxC } from './entities/cobro-cxc.entity';
import { Poliza } from './entities/poliza.entity';
import type { IntegracionContableService } from './integracion-contable.service';
import type { FoliosService } from './folios.service';
import type { CuentasService } from './cuentas.service';
import type { CentrosCostoService } from './centros-costo.service';
const CXC_PUBLIC_ID = '0199a000-0000-7000-8000-000000000001';

describe('CxcService', () => {
  const cuentaRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
  };
  const cobroRepository = {
    find: jest.fn(),
  };
  const cuentaManager = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const cobroManager = {
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };
  const ventaManager = {
    findOne: jest.fn(),
  };
  const polizaManager = {
    findOne: jest.fn(),
  };
  const clienteRepository = {
    findOne: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity === CobroCxC) return cobroManager;
      if (entity === CuentaPorCobrar) return cuentaManager;
      if (entity === Venta) return ventaManager;
      if (entity === Poliza) return polizaManager;
      return {};
    }),
  };
  const dataSource = {
    transaction: jest.fn((callback: any) => callback(manager)),
    getRepository: jest.fn((entity) => {
      if (entity === Cliente) return clienteRepository;
      return {};
    }),
  };
  const integracionContableService = {
    registrarVenta: jest.fn(),
    registrarCobro: jest.fn(),
    registrarCancelacionVenta: jest.fn(),
    registrarCxcManual: jest.fn(),
    cancelarPoliza: jest.fn(),
  };
  const foliosService = { siguiente: jest.fn() };
  const cuentasService = {
    buscarPorCodigo: jest.fn(),
    buscarPorId: jest.fn(),
  };
  const centrosCostoService = {
    buscarPorId: jest.fn(),
  };

  let service: CxcService;

  const cuentaBase = {
    id: 1,
    publicId: CXC_PUBLIC_ID,
    monto: '200.00',
    saldo: '200.00',
    estatus: 'pendiente',
    ventaId: null,
    polizaId: null,
    cobros: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cuentaManager.findOne.mockResolvedValue(null);
    cuentaManager.find.mockResolvedValue([]);
    cuentaManager.create.mockImplementation((data) => ({ ...data }));
    cuentaManager.save.mockImplementation((data) => ({ id: 1, ...data }));
    cuentaManager.update.mockResolvedValue(undefined);
    cobroManager.create.mockImplementation((data) => ({ ...data }));
    cobroManager.save.mockImplementation((data) => ({ id: 5, ...data }));
    cobroManager.count.mockResolvedValue(0);
    cobroManager.find.mockResolvedValue([]);
    integracionContableService.registrarVenta.mockResolvedValue({ id: 99 });
    integracionContableService.registrarCobro.mockResolvedValue({ id: 99 });
    integracionContableService.registrarCancelacionVenta.mockResolvedValue({
      id: 120,
    });
    integracionContableService.registrarCxcManual.mockResolvedValue({
      id: 121,
    });
    foliosService.siguiente.mockResolvedValue(1);
    cuentasService.buscarPorCodigo.mockResolvedValue({
      id: 9,
      codigo: '4101',
      tipo: 'ingreso',
      activo: true,
      permiteMovimientos: true,
    });
    cuentasService.buscarPorId.mockResolvedValue({
      id: 9,
      codigo: '4102',
      tipo: 'ingreso',
      activo: true,
      permiteMovimientos: true,
    });
    centrosCostoService.buscarPorId.mockResolvedValue({
      id: 7,
      codigo: 'CC-1',
      activo: true,
    });
    clienteRepository.findOne.mockResolvedValue({ id: 5 });
    ventaManager.findOne.mockResolvedValue(null);
    polizaManager.findOne.mockResolvedValue(null);

    service = new CxcService(
      cuentaRepository as unknown as Repository<CuentaPorCobrar>,
      cobroRepository as unknown as Repository<CobroCxC>,
      dataSource as unknown as DataSource,
      integracionContableService as unknown as IntegracionContableService,
      foliosService as unknown as FoliosService,
      cuentasService as unknown as CuentasService,
      centrosCostoService as unknown as CentrosCostoService,
    );
  });

  it('crea la CxC desde una venta y asocia la póliza', async () => {
    const venta = {
      id: 10,
      folio: 'VT-20261110-0001',
      clienteId: 2,
      fechaVenta: '2026-11-10',
      subtotal: 1000,
      iva: 160,
      total: 1160,
    };

    const resultado = await service.crearDesdeVenta(
      venta as unknown as Venta,
      1,
    );

    expect(cuentaManager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        folio: 'CXC-VT-20261110-0001',
        monto: 1160,
        saldo: 1160,
        estatus: 'pendiente',
      }),
    );
    expect(integracionContableService.registrarVenta).toHaveBeenCalledWith(
      venta,
      1,
      manager,
      undefined,
    );
    expect(cuentaManager.update).toHaveBeenCalledWith(1, { polizaId: 99 });
    expect(resultado).toEqual(
      expect.objectContaining({ folio: 'CXC-VT-20261110-0001' }),
    );
  });

  it('no duplica la CxC si la venta ya tiene una', async () => {
    cuentaManager.findOne.mockResolvedValue({ id: 1, saldo: '0.00' });

    const resultado = await service.crearDesdeVenta(
      { id: 10 } as unknown as Venta,
      1,
    );

    expect(cuentaManager.save).not.toHaveBeenCalled();
    expect(resultado).toEqual({ id: 1, saldo: '0.00' });
  });

  it('crea una CxC manual con su póliza contable', async () => {
    cuentaManager.save.mockImplementation((data) => ({ id: 20, ...data }));
    cuentaRepository.findOne.mockResolvedValue({
      id: 20,
      publicId: 'cxc-manual',
    });
    const buscarPorId = jest.spyOn(service, 'buscarPorId').mockResolvedValue({
      id: 20,
      publicId: 'cxc-manual',
    } as unknown as CuentaPorCobrar);

    const resultado = await service.crearManual(
      {
        clienteId: 'cliente-public',
        fechaEmision: '2026-11-10',
        monto: 116,
        iva: 16,
        cuentaIngresoId: 'cuenta-4102',
        concepto: 'Servicio de consultoría',
        centroCostoId: 'centro-1',
      },
      1,
    );

    expect(cuentaManager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ventaId: null,
        monto: 116,
        subtotal: 100,
        iva: 16,
        saldo: 116,
        cuentaContableId: 9,
      }),
    );
    expect(integracionContableService.registrarCxcManual).toHaveBeenCalledWith(
      expect.stringMatching(/^CXC-MAN-\d{8}-0001$/),
      '2026-11-10',
      100,
      16,
      '4102',
      'Servicio de consultoría',
      1,
      manager,
      7,
    );
    expect(cuentaManager.update).toHaveBeenCalledWith(20, { polizaId: 121 });
    expect(buscarPorId).toHaveBeenCalledWith('cxc-manual');
    expect(resultado).toEqual({ id: 20, publicId: 'cxc-manual' });
  });

  it('registra un cobro múltiple y distribuye el monto entre CxC', async () => {
    cuentaManager.find.mockResolvedValue([
      { id: 1, publicId: 'c1' },
      { id: 2, publicId: 'c2' },
    ]);
    cuentaManager.findOne.mockImplementation(
      ({ where }: { where: { id: number } }) => {
        if (where.id === 1) {
          return Promise.resolve({
            id: 1,
            publicId: 'c1',
            clienteId: 5,
            folio: 'CXC-1',
            saldo: '100.00',
            estatus: 'pendiente',
          });
        }
        return Promise.resolve({
          id: 2,
          publicId: 'c2',
          clienteId: 5,
          folio: 'CXC-2',
          saldo: '200.00',
          estatus: 'parcial',
        });
      },
    );
    polizaManager.findOne.mockResolvedValue({
      id: 99,
      publicId: 'poliza-99',
      folio: 'POL-202611-0001',
    });
    cobroManager.save
      .mockResolvedValueOnce({ id: 30 })
      .mockResolvedValueOnce({ id: 31 });

    const resultado = await service.registrarCobroMultiple(
      {
        fecha: '2026-11-11',
        metodoPago: 'transferencia',
        referencia: 'SPEI-MULTI',
        aplicaciones: [
          { cuentaId: 'c1', monto: 60 },
          { cuentaId: 'c2', monto: 40 },
        ],
      },
      1,
    );

    expect(integracionContableService.registrarCobro).toHaveBeenCalledWith(
      '2026-11-11',
      100,
      'transferencia',
      1,
      manager,
    );
    expect(cuentaManager.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ saldo: 40, estatus: 'parcial' }),
    );
    expect(cuentaManager.update).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ saldo: 160, estatus: 'parcial' }),
    );
    expect(cobroManager.save).toHaveBeenCalledTimes(2);
    expect(resultado).toEqual({
      total: 100,
      poliza: { publicId: 'poliza-99', folio: 'POL-202611-0001' },
      aplicaciones: [
        {
          cobroId: 30,
          cuenta: { publicId: 'c1', folio: 'CXC-1' },
          monto: 60,
          saldoAnterior: 100,
          saldo: 40,
          estatus: 'parcial',
        },
        {
          cobroId: 31,
          cuenta: { publicId: 'c2', folio: 'CXC-2' },
          monto: 40,
          saldoAnterior: 200,
          saldo: 160,
          estatus: 'parcial',
        },
      ],
    });
  });

  it('rechaza un cobro múltiple con la misma cuenta repetida', async () => {
    await expect(
      service.registrarCobroMultiple(
        {
          fecha: '2026-11-11',
          metodoPago: 'efectivo',
          aplicaciones: [
            { cuentaId: 'c1', monto: 10 },
            { cuentaId: 'c1', monto: 20 },
          ],
        },
        1,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('registra un cobro parcial y actualiza saldo/estatus', async () => {
    cuentaManager.findOne.mockResolvedValue({ ...cuentaBase });
    jest.spyOn(service, 'buscarPorId').mockResolvedValue({
      ...cuentaBase,
    } as unknown as CuentaPorCobrar);

    await service.registrarCobro(
      CXC_PUBLIC_ID,
      {
        fecha: '2026-11-11',
        monto: 100,
        metodoPago: 'transferencia',
        referencia: 'SPEI-1',
      },
      1,
    );

    expect(cuentaManager.findOne).toHaveBeenCalledWith({
      where: { publicId: CXC_PUBLIC_ID },
      lock: { mode: 'pessimistic_write' },
    });
    expect(integracionContableService.registrarCobro).toHaveBeenCalledWith(
      '2026-11-11',
      100,
      'transferencia',
      1,
      manager,
    );
    expect(cobroManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ monto: 100, polizaId: 99 }),
    );
    expect(cuentaManager.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ saldo: 100, estatus: 'parcial' }),
    );
  });

  it('rechaza un cobro mayor al saldo', async () => {
    cuentaManager.findOne.mockResolvedValue({
      ...cuentaBase,
      saldo: '50.00',
    });

    await expect(
      service.registrarCobro(
        CXC_PUBLIC_ID,
        { fecha: '2026-11-11', monto: 100, metodoPago: 'efectivo' },
        1,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(cuentaManager.update).not.toHaveBeenCalled();
    expect(integracionContableService.registrarCobro).not.toHaveBeenCalled();
  });

  it('cancela una cuenta con cobros y agrupa el reverso por método', async () => {
    cuentaManager.findOne.mockResolvedValue({
      ...cuentaBase,
      saldo: '50.00',
      ventaId: 10,
    });
    ventaManager.findOne.mockResolvedValue({
      id: 10,
      folio: 'VT-20261110-0001',
      total: '200.00',
      iva: '27.59',
    });
    cobroManager.find.mockResolvedValue([
      { monto: '100.00', metodoPago: 'efectivo', polizaId: null },
      { monto: '50.00', metodoPago: 'tarjeta', polizaId: null },
    ]);

    const resultado = await service.cancelar(CXC_PUBLIC_ID, 1);

    expect(
      integracionContableService.registrarCancelacionVenta,
    ).toHaveBeenCalledWith(
      'VT-20261110-0001',
      200,
      27.59,
      50,
      [
        { codigo: '1101', monto: 100 },
        { codigo: '1106', monto: 50 },
      ],
      1,
      manager,
      '4101',
      'venta',
      undefined,
    );
    expect(cuentaManager.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        estatus: 'cancelada',
        saldo: 0,
        polizaCancelacionId: 120,
      }),
    );
    expect(resultado).toEqual({
      msg: 'Cuenta por cobrar cancelada exitosamente',
    });
  });

  it('no cancela una cuenta que ya está cancelada', async () => {
    cuentaManager.findOne.mockResolvedValue({
      ...cuentaBase,
      estatus: 'cancelada',
    });

    await expect(service.cancelar(CXC_PUBLIC_ID, 1)).rejects.toThrow(
      BadRequestException,
    );

    expect(
      integracionContableService.registrarCancelacionVenta,
    ).not.toHaveBeenCalled();
  });
});
