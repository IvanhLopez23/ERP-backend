import { BadRequestException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { BancosService } from './bancos.service';
import { CuentaBancaria } from './entities/cuenta-bancaria.entity';
import { MovimientoBancario } from './entities/movimiento-bancario.entity';
import { PolizaDetalle } from './entities/poliza-detalle.entity';
import { ConciliacionBancaria } from './entities/conciliacion-bancaria.entity';
import type { CuentasService } from './cuentas.service';

describe('BancosService', () => {
  const cuentaRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const movimientoRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const detalleRepository = { findOne: jest.fn(), find: jest.fn() };
  const conciliacionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity === MovimientoBancario) return movimientoRepository;
      if (entity === ConciliacionBancaria) return conciliacionRepository;
      return {};
    }),
  };
  const dataSource = {
    query: jest.fn(),
    transaction: jest.fn((callback: any) => callback(manager)),
    getRepository: jest.fn((entity) => {
      if (entity === PolizaDetalle) return detalleRepository;
      if (entity === ConciliacionBancaria) return conciliacionRepository;
      return {};
    }),
  };
  const cuentasService = {
    buscarPorCodigo: jest.fn(),
    buscarPorId: jest.fn(),
  };

  let service: BancosService;

  const cuentaBase = {
    id: 1,
    publicId: 'banco-1',
    nombre: 'Cuenta BBVA',
    cuentaContableId: 2,
    saldoInicial: 0,
    activo: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cuentaRepository.findOne.mockResolvedValue({ ...cuentaBase });
    movimientoRepository.findOne.mockResolvedValue(null);
    movimientoRepository.find.mockResolvedValue([]);
    movimientoRepository.create.mockImplementation((data) => ({ ...data }));
    movimientoRepository.save.mockImplementation((data) => ({
      id: 10,
      ...data,
    }));
    movimientoRepository.update.mockResolvedValue(undefined);
    conciliacionRepository.findOne.mockResolvedValue(null);
    conciliacionRepository.find.mockResolvedValue([]);
    conciliacionRepository.count.mockResolvedValue(0);
    conciliacionRepository.create.mockImplementation((data) => ({ ...data }));
    conciliacionRepository.save.mockImplementation((data) => ({
      id: 30,
      ...data,
    }));
    conciliacionRepository.delete.mockResolvedValue(undefined);

    service = new BancosService(
      cuentaRepository as unknown as Repository<CuentaBancaria>,
      movimientoRepository as unknown as Repository<MovimientoBancario>,
      dataSource as unknown as DataSource,
      cuentasService as unknown as CuentasService,
    );
  });

  it('rechaza un movimiento con cargo y abono a la vez', async () => {
    await expect(
      service.crearMovimiento(
        'banco-1',
        {
          fecha: '2026-11-10',
          descripcion: 'Movimiento inválido',
          cargo: 100,
          abono: 50,
        },
        1,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(movimientoRepository.save).not.toHaveBeenCalled();
  });

  it('concilia automáticamente por monto y fecha', async () => {
    movimientoRepository.find.mockResolvedValue([
      {
        id: 10,
        publicId: 'mov-1',
        fecha: '2026-11-10',
        cargo: '100.00',
        abono: '0.00',
        polizaDetalleId: null,
      },
    ]);
    dataSource.query.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 20,
        public_id: 'detalle-1',
        debe: '100.00',
        haber: '0.00',
        fecha: '2026-11-11',
        referencia: null,
        concepto: null,
        poliza_concepto: 'Cobro',
        folio: 'POL-1',
      },
    ]);

    const resultado = await service.conciliarAutomatico(
      'banco-1',
      {
        desde: '2026-11-01',
        hasta: '2026-11-30',
        toleranciaDias: 3,
      },
      1,
    );

    expect(resultado.conciliados).toHaveLength(1);
    expect(resultado.sinConciliar).toBe(0);
    expect(conciliacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        movimientoBancarioId: 10,
        polizaDetalleId: 20,
        montoAplicado: 100,
        usuarioId: 1,
      }),
    );
    expect(movimientoRepository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ polizaDetalleId: 20 }),
    );
  });

  it('concilia manualmente un movimiento con su póliza', async () => {
    movimientoRepository.findOne
      .mockResolvedValueOnce({
        id: 10,
        publicId: 'mov-1',
        cuentaBancariaId: 1,
        cargo: '100.00',
        abono: '0.00',
        polizaDetalleId: null,
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 10,
        publicId: 'mov-1',
        fecha: '2026-11-10',
        descripcion: 'Cobro',
        referencia: null,
        cargo: '100.00',
        abono: '0.00',
        saldo: null,
        polizaDetalleId: 20,
        conciliadoEn: new Date(),
        polizaDetalle: { poliza: { folio: 'POL-1' } },
      });
    detalleRepository.findOne.mockResolvedValue({
      id: 20,
      publicId: 'detalle-1',
      cuentaId: 2,
      debe: '100.00',
      haber: '0.00',
      poliza: { estatus: 'contabilizada' },
    });

    const resultado = await service.conciliar(
      'banco-1',
      'mov-1',
      {
        polizaDetalleId: 'detalle-1',
      },
      1,
    );

    expect(conciliacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        movimientoBancarioId: 10,
        polizaDetalleId: 20,
        montoAplicado: 100,
        usuarioId: 1,
      }),
    );
    expect(movimientoRepository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ polizaDetalleId: 20 }),
    );
    expect(resultado.conciliado).toBe(true);
    expect(resultado.polizaFolio).toBe('POL-1');
  });

  it('rechaza conciliar si el monto no coincide', async () => {
    movimientoRepository.findOne
      .mockResolvedValueOnce({
        id: 10,
        publicId: 'mov-1',
        cuentaBancariaId: 1,
        cargo: '100.00',
        abono: '0.00',
        polizaDetalleId: null,
      })
      .mockResolvedValueOnce(null);
    detalleRepository.findOne.mockResolvedValue({
      id: 20,
      publicId: 'detalle-1',
      cuentaId: 2,
      debe: '90.00',
      haber: '0.00',
      poliza: { estatus: 'contabilizada' },
    });

    await expect(
      service.conciliar(
        'banco-1',
        'mov-1',
        {
          polizaDetalleId: 'detalle-1',
        },
        1,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(movimientoRepository.update).not.toHaveBeenCalled();
  });

  it('concilia un movimiento contra varios detalles de póliza', async () => {
    movimientoRepository.findOne
      .mockResolvedValueOnce({
        id: 10,
        publicId: 'mov-1',
        cuentaBancariaId: 1,
        cargo: '150.00',
        abono: '0.00',
        polizaDetalleId: null,
      })
      .mockResolvedValueOnce({
        id: 10,
        publicId: 'mov-1',
        fecha: '2026-11-10',
        descripcion: 'Cobro múltiple',
        referencia: null,
        cargo: '150.00',
        abono: '0.00',
        saldo: null,
        polizaDetalleId: 20,
        conciliadoEn: new Date(),
        polizaDetalle: { poliza: { folio: 'POL-1' } },
        conciliaciones: [],
      });
    detalleRepository.find.mockResolvedValue([
      {
        id: 20,
        publicId: 'detalle-1',
        cuentaId: 2,
        debe: '100.00',
        haber: '0.00',
        poliza: { estatus: 'contabilizada' },
      },
      {
        id: 21,
        publicId: 'detalle-2',
        cuentaId: 2,
        debe: '50.00',
        haber: '0.00',
        poliza: { estatus: 'contabilizada' },
      },
    ]);
    conciliacionRepository.find.mockResolvedValue([]);
    conciliacionRepository.save.mockResolvedValue([]);

    const resultado = await service.conciliarMultiple(
      'banco-1',
      'mov-1',
      {
        aplicaciones: [
          { polizaDetalleId: 'detalle-1', monto: 100 },
          { polizaDetalleId: 'detalle-2', monto: 50 },
        ],
      },
      1,
    );

    expect(conciliacionRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          movimientoBancarioId: 10,
          polizaDetalleId: 20,
          montoAplicado: 100,
        }),
        expect.objectContaining({
          movimientoBancarioId: 10,
          polizaDetalleId: 21,
          montoAplicado: 50,
        }),
      ]),
    );
    expect(movimientoRepository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ polizaDetalleId: 20 }),
    );
    expect(resultado.conciliado).toBe(true);
  });

  it('rechaza una conciliación múltiple cuya suma no coincide', async () => {
    movimientoRepository.findOne.mockResolvedValueOnce({
      id: 10,
      publicId: 'mov-1',
      cuentaBancariaId: 1,
      cargo: '150.00',
      abono: '0.00',
      polizaDetalleId: null,
    });

    await expect(
      service.conciliarMultiple(
        'banco-1',
        'mov-1',
        {
          aplicaciones: [
            { polizaDetalleId: 'detalle-1', monto: 100 },
            { polizaDetalleId: 'detalle-2', monto: 30 },
          ],
        },
        1,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(conciliacionRepository.save).not.toHaveBeenCalled();
  });

  it('importa un CSV y evita duplicados en una segunda carga', async () => {
    const guardados: Array<{
      id: number;
      hashImportacion?: string;
    }> = [];
    movimientoRepository.find.mockResolvedValue([]);
    movimientoRepository.save.mockImplementation((data) => {
      const filas = (Array.isArray(data) ? data : [data]) as Array<{
        fecha?: string;
        descripcion?: string;
        referencia?: string | null;
        cargo?: number;
        abono?: number;
        saldo?: number | null;
        polizaDetalleId?: number | null;
        conciliadoEn?: Date | null;
        hashImportacion?: string;
      }>;
      const resultado = filas.map((fila, indice) => ({
        ...fila,
        id: 100 + indice,
      }));
      guardados.push(...resultado);
      return Promise.resolve(Array.isArray(data) ? resultado : resultado[0]);
    });

    const csv = [
      'fecha,descripcion,monto',
      '2026-11-12,Cobro importado,100',
      '2026-11-13,Pago importado,-50',
    ].join('\n');

    const primera = await service.importarMovimientos(
      'banco-1',
      Buffer.from(csv),
      'estado.csv',
      'auto',
      1,
    );

    expect(primera.formato).toBe('csv');
    expect(primera.importados).toBe(2);
    expect(primera.duplicados).toBe(0);

    movimientoRepository.find.mockResolvedValue(
      guardados.map((fila) => ({ hashImportacion: fila.hashImportacion })),
    );

    const segunda = await service.importarMovimientos(
      'banco-1',
      Buffer.from(csv),
      'estado.csv',
      'auto',
      1,
    );

    expect(segunda.importados).toBe(0);
    expect(segunda.duplicados).toBe(2);
  });
});
