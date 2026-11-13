import { BadRequestException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';
import type { Equipo } from './entities/equipo.entity';
import type { PlanMantenimiento } from './entities/plan-mantenimiento.entity';
import type { OrdenTrabajo } from './entities/orden-trabajo.entity';
import type { DetalleOrdenTrabajo } from './entities/detalle-orden-trabajo.entity';
import type { UpdateEstatusOrdenDto } from './dto/update-estatus-orden.dto';

describe('OrdenesTrabajoService', () => {
  const ordenRepository = { findOne: jest.fn(), update: jest.fn() };

  let service: OrdenesTrabajoService;

  const cambiarEstatus = (publicId: string, dto: UpdateEstatusOrdenDto) =>
    service.actualizarEstatusOrden(publicId, dto);

  beforeEach(() => {
    jest.clearAllMocks();
    ordenRepository.update.mockResolvedValue(undefined);

    service = new OrdenesTrabajoService(
      {} as unknown as Repository<Equipo>,
      {} as unknown as Repository<PlanMantenimiento>,
      ordenRepository as unknown as Repository<OrdenTrabajo>,
      {} as unknown as Repository<DetalleOrdenTrabajo>,
      {} as unknown as DataSource,
    );
  });

  describe('actualizarEstatusOrden', () => {
    it('permite pasar de pendiente a en_progreso', async () => {
      ordenRepository.findOne.mockResolvedValue({
        id: 1,
        estatus: 'pendiente',
      });

      await cambiarEstatus('ot-public', { estatus: 'en_progreso' });

      expect(ordenRepository.update).toHaveBeenCalledWith(1, {
        estatus: 'en_progreso',
      });
    });

    it('permite cancelar una orden pendiente', async () => {
      ordenRepository.findOne.mockResolvedValue({
        id: 2,
        estatus: 'pendiente',
      });

      await cambiarEstatus('ot-public', { estatus: 'cancelada' });

      expect(ordenRepository.update).toHaveBeenCalledWith(2, {
        estatus: 'cancelada',
      });
    });

    it('registra fecha de ejecución y costo al completar', async () => {
      ordenRepository.findOne.mockResolvedValue({
        id: 3,
        estatus: 'en_progreso',
      });

      await cambiarEstatus('ot-public', { estatus: 'completada', costo: 1500 });

      expect(ordenRepository.update).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          estatus: 'completada',
          costo: 1500,
          fechaEjecucion: expect.any(Date),
        }),
      );
    });

    it('rechaza una transición inválida', async () => {
      ordenRepository.findOne.mockResolvedValue({
        id: 4,
        estatus: 'pendiente',
      });

      await expect(
        cambiarEstatus('ot-public', { estatus: 'completada' }),
      ).rejects.toThrow(BadRequestException);
      expect(ordenRepository.update).not.toHaveBeenCalled();
    });

    it('rechaza modificar una orden completada', async () => {
      ordenRepository.findOne.mockResolvedValue({
        id: 5,
        estatus: 'completada',
      });

      await expect(
        cambiarEstatus('ot-public', { estatus: 'en_progreso' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza error si la orden no existe', async () => {
      ordenRepository.findOne.mockResolvedValue(null);

      await expect(
        cambiarEstatus('ot-inexistente', { estatus: 'en_progreso' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
