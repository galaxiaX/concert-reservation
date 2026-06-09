import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';

describe('ConcertsService', () => {
  let service: ConcertsService;
  let prisma: {
    concert: {
      create: jest.Mock;
      updateMany: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      concert: {
        create: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new ConcertsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('persists the concert fields', async () => {
      const dto = { name: 'Show', description: 'Desc', totalSeats: 50 };
      prisma.concert.create.mockResolvedValue({ id: 'c1', ...dto });

      await service.create(dto);

      expect(prisma.concert.create).toHaveBeenCalledWith({
        data: { name: 'Show', description: 'Desc', totalSeats: 50 },
      });
    });
  });

  describe('list', () => {
    it('returns only non-deleted concerts', async () => {
      prisma.concert.findMany.mockResolvedValue([]);

      await service.list('u1');

      expect(prisma.concert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes by stamping deletedAt on a live concert', async () => {
      prisma.concert.updateMany.mockResolvedValue({ count: 1 });

      await service.remove('c1');

      expect(prisma.concert.updateMany).toHaveBeenCalledWith({
        where: { id: 'c1', deletedAt: null },
        data: { deletedAt: expect.any(Date) as Date },
      });
    });

    it('maps a missing or already-deleted concert to 404', async () => {
      prisma.concert.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rethrows unexpected errors', async () => {
      prisma.concert.updateMany.mockRejectedValue(new Error('db down'));

      await expect(service.remove('c1')).rejects.toThrow('db down');
    });
  });

  describe('delete authorization', () => {
    it('gates the delete handler to ADMIN only', () => {
      const roles = new Reflector().get<Role[]>(
        ROLES_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- reading metadata off the handler, not invoking it
        ConcertsController.prototype.remove,
      );
      expect(roles).toEqual([Role.ADMIN]);
    });
  });
});
