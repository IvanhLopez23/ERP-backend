import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { PresupuestosService } from './presupuestos.service';
import { PresupuestoCentroCosto } from './entities/presupuesto-centro-costo.entity';
import type { CentrosCostoService } from './centros-costo.service';

describe('PresupuestosService', () => {
  const presupuestoRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const centrosCostoService = { buscarPorId: jest.fn() };

  let service: PresupuestosService;

  beforeEach(() => {
    jest.clearAllMocks();
    centrosCostoService.buscarPorId.mockResolvedValue({
      id: 1,
      codigo: 'CC-ADMIN',
      activo: true,
    });
    presupuestoRepository.findOne.mockResolvedValue(null);
    presupuestoRepository.create.mockImplementation((data) => ({ ...data }));
    presupuestoRepository.save.mockImplementation((data) => ({
      id: 1,
      ...data,
    }));
    presupuestoRepository.upsert.mockResolvedValue(undefined);

    service = new PresupuestosService(
      presupuestoRepository as unknown as Repository<PresupuestoCentroCosto>,
      centrosCostoService as unknown as CentrosCostoService,
    );
  });

  it('crea un presupuesto mensual para un centro', async () => {
    const resultado = await service.crear(
      {
        anio: 2026,
        mes: 11,
        centroCostoId: 'centro-1',
        ingresosPresupuestados: 500,
        gastosPresupuestados: 300,
      },
      1,
    );

    expect(presupuestoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        anio: 2026,
        mes: 11,
        centroCostoId: 1,
        ingresosPresupuestados: 500,
        gastosPresupuestados: 300,
        usuarioId: 1,
      }),
    );
    expect(resultado).toEqual(expect.objectContaining({ anio: 2026 }));
  });

  it('rechaza un presupuesto duplicado', async () => {
    presupuestoRepository.findOne.mockResolvedValue({ id: 1 });

    await expect(
      service.crear(
        {
          anio: 2026,
          mes: 11,
          centroCostoId: 'centro-1',
        },
        1,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(presupuestoRepository.save).not.toHaveBeenCalled();
  });

  it('guarda presupuestos en lote con upsert', async () => {
    const resultado = await service.crearBulk(
      {
        presupuestos: [
          {
            anio: 2026,
            mes: 11,
            centroCostoId: 'centro-1',
            ingresosPresupuestados: 500,
            gastosPresupuestados: 300,
          },
        ],
      },
      1,
    );

    expect(presupuestoRepository.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          anio: 2026,
          mes: 11,
          centroCostoId: 1,
        }),
      ],
      ['anio', 'mes', 'centroCostoId'],
    );
    expect(resultado.total).toBe(1);
  });
});
