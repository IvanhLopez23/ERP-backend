import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { InventarioService } from './inventario.service';
import type { Producto } from './entities/producto.entity';
import type { Almacen } from './entities/almacen.entity';
import type { Inventario } from './entities/inventario.entity';
import type { MovimientoInventario } from './entities/movimiento-inventario.entity';
import type { ProductosService } from './productos.service';
import type { AlmacenesService } from './almacenes.service';

describe('InventarioService', () => {
  const productoRepository = { findOne: jest.fn() };
  const almacenRepository = { findOne: jest.fn() };
  const inventarioRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const movimientoRepository = { create: jest.fn(), save: jest.fn() };
  const productosService = { buscarProductoPorId: jest.fn() };
  const almacenesService = { buscarAlmacenPorId: jest.fn() };

  let service: InventarioService;

  beforeEach(() => {
    jest.clearAllMocks();
    productoRepository.findOne.mockResolvedValue({ id: 1 });
    almacenRepository.findOne.mockResolvedValue({ id: 2 });
    inventarioRepository.create.mockImplementation((data) => ({ ...data }));
    inventarioRepository.save.mockImplementation((data) =>
      Promise.resolve({ id: 10, ...data }),
    );
    inventarioRepository.update.mockResolvedValue(undefined);
    movimientoRepository.create.mockImplementation((data) => ({ ...data }));
    movimientoRepository.save.mockImplementation((data) =>
      Promise.resolve({ id: 99, ...data }),
    );

    service = new InventarioService(
      productoRepository as unknown as Repository<Producto>,
      almacenRepository as unknown as Repository<Almacen>,
      inventarioRepository as unknown as Repository<Inventario>,
      movimientoRepository as unknown as Repository<MovimientoInventario>,
      productosService as unknown as ProductosService,
      almacenesService as unknown as AlmacenesService,
    );
  });

  describe('actualizarInventario', () => {
    it('suma la existencia en una entrada', async () => {
      inventarioRepository.findOne.mockResolvedValue({
        id: 10,
        existencia: 5,
      });

      await service.actualizarInventario(1, 2, 3, 'entrada');

      expect(inventarioRepository.update).toHaveBeenCalledWith(10, {
        existencia: 8,
      });
      expect(movimientoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          productoId: 1,
          almacenId: 2,
          tipo: 'entrada',
          cantidad: 3,
          existenciaAnterior: 5,
          existenciaNueva: 8,
        }),
      );
    });

    it('resta la existencia en una salida', async () => {
      inventarioRepository.findOne.mockResolvedValue({
        id: 10,
        existencia: 5,
      });

      await service.actualizarInventario(1, 2, 2, 'salida');

      expect(inventarioRepository.update).toHaveBeenCalledWith(10, {
        existencia: 3,
      });
    });

    it('rechaza una salida sin existencia suficiente', async () => {
      inventarioRepository.findOne.mockResolvedValue({
        id: 10,
        existencia: 2,
      });

      await expect(
        service.actualizarInventario(1, 2, 5, 'salida'),
      ).rejects.toThrow(BadRequestException);
      expect(inventarioRepository.update).not.toHaveBeenCalled();
    });

    it('fija la existencia exacta en un ajuste', async () => {
      inventarioRepository.findOne.mockResolvedValue({
        id: 10,
        existencia: 20,
      });

      await service.actualizarInventario(1, 2, 7, 'ajuste');

      expect(inventarioRepository.update).toHaveBeenCalledWith(10, {
        existencia: 7,
      });
    });

    it('crea el registro de inventario cuando no existe', async () => {
      inventarioRepository.findOne.mockResolvedValue(null);

      await service.actualizarInventario(1, 2, 4, 'entrada');

      expect(inventarioRepository.create).toHaveBeenCalledWith({
        productoId: 1,
        almacenId: 2,
        existencia: 0,
      });
      expect(inventarioRepository.update).toHaveBeenCalledWith(10, {
        existencia: 4,
      });
    });
  });

  describe('buscarInventarioPorProductoAlmacen', () => {
    it('devuelve existencia 0 cuando no hay registro', async () => {
      productosService.buscarProductoPorId.mockResolvedValue({ id: 1 });
      almacenesService.buscarAlmacenPorId.mockResolvedValue({ id: 2 });
      inventarioRepository.findOne.mockResolvedValue(null);

      const resultado = await service.buscarInventarioPorProductoAlmacen(
        'prod-public',
        'almacen-public',
      );

      expect(resultado).toEqual({
        productoId: 'prod-public',
        almacenId: 'almacen-public',
        existencia: 0,
      });
    });
  });
});
