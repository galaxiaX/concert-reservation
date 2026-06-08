import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let tx: {
    $queryRaw: jest.Mock;
    reservation: {
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
  };
  let prisma: {
    $transaction: jest.Mock;
    reservation: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    tx = {
      $queryRaw: jest.fn(),
      reservation: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
      reservation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ReservationsService(prisma as unknown as PrismaService);
  });

  describe('reserve', () => {
    it('creates a reservation when a seat is free', async () => {
      tx.$queryRaw.mockResolvedValue([{ id: 'c1', totalSeats: 2 }]);
      tx.reservation.findFirst.mockResolvedValue(null);
      tx.reservation.count.mockResolvedValue(1);
      tx.reservation.create.mockResolvedValue({ id: 'r1' });

      const result = await service.reserve('u1', 'c1');

      expect(result).toEqual({ id: 'r1' });
      expect(tx.reservation.create).toHaveBeenCalledWith({
        data: { userId: 'u1', concertId: 'c1' },
      });
    });

    it('throws 404 when the concert does not exist', async () => {
      tx.$queryRaw.mockResolvedValue([]);

      await expect(service.reserve('u1', 'gone')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a duplicate active reservation', async () => {
      tx.$queryRaw.mockResolvedValue([{ id: 'c1', totalSeats: 2 }]);
      tx.reservation.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.reserve('u1', 'c1')).rejects.toThrow(
        'You already reserved this concert',
      );
      expect(tx.reservation.create).not.toHaveBeenCalled();
    });

    it('rejects when the concert is fully booked', async () => {
      tx.$queryRaw.mockResolvedValue([{ id: 'c1', totalSeats: 1 }]);
      tx.reservation.findFirst.mockResolvedValue(null);
      tx.reservation.count.mockResolvedValue(1);

      await expect(service.reserve('u1', 'c1')).rejects.toThrow(
        'Concert is fully booked',
      );
      expect(tx.reservation.create).not.toHaveBeenCalled();
    });

    it('maps the partial-unique race (P2002) to a duplicate 409', async () => {
      tx.$queryRaw.mockResolvedValue([{ id: 'c1', totalSeats: 2 }]);
      tx.reservation.findFirst.mockResolvedValue(null);
      tx.reservation.count.mockResolvedValue(0);
      tx.reservation.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.reserve('u1', 'c1')).rejects.toThrow(
        'You already reserved this concert',
      );
    });
  });

  describe('cancel', () => {
    const active = {
      id: 'r1',
      userId: 'u1',
      status: ReservationStatus.ACTIVE,
    };

    it('soft-cancels the owner reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(active);
      prisma.reservation.update.mockResolvedValue({
        ...active,
        status: ReservationStatus.CANCELED,
      });

      await service.cancel('u1', 'r1');

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: {
          status: ReservationStatus.CANCELED,
          canceledAt: expect.any(Date) as Date,
        },
      });
    });

    it('throws 404 for a missing reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.cancel('u1', 'gone')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('forbids cancelling someone else’s reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        ...active,
        userId: 'other',
      });

      await expect(service.cancel('u1', 'r1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.reservation.update).not.toHaveBeenCalled();
    });

    it('rejects cancelling an already-canceled reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        ...active,
        status: ReservationStatus.CANCELED,
      });

      await expect(service.cancel('u1', 'r1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
