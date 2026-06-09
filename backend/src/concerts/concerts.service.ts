import { Injectable, NotFoundException } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateConcertDto } from './dto/create-concert.dto';

export interface ConcertListItem {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  isReservedByCurrentUser: boolean;
  reservationId: string | null;
}

export interface AdminStats {
  totalSeats: number;
  reserved: number;
  canceled: number;
}

@Injectable()
export class ConcertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<ConcertListItem[]> {
    const concerts = await this.prisma.concert.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { reservations: { where: { status: ReservationStatus.ACTIVE } } },
        },
        reservations: {
          where: { userId, status: ReservationStatus.ACTIVE },
          select: { id: true },
        },
      },
    });

    return concerts.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      totalSeats: c.totalSeats,
      availableSeats: c.totalSeats - c._count.reservations,
      isReservedByCurrentUser: c.reservations.length > 0,
      reservationId: c.reservations[0]?.id ?? null,
    }));
  }

  async create(dto: CreateConcertDto) {
    return this.prisma.concert.create({
      data: {
        name: dto.name,
        description: dto.description,
        totalSeats: dto.totalSeats,
      },
    });
  }

  /**
   * Soft-delete: stamp `deletedAt` instead of removing the row, so reservation
   * rows (and their concert name) survive for the admin audit trail and user
   * history. The concert drops out of listings and stats via the `deletedAt`
   * filters. A no-op update (already deleted or missing) maps to 404.
   */
  async remove(id: string): Promise<void> {
    const { count } = await this.prisma.concert.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) {
      throw new NotFoundException('Concert not found');
    }
  }

  async stats(): Promise<AdminStats> {
    const [seats, reserved, canceled] = await Promise.all([
      this.prisma.concert.aggregate({
        _sum: { totalSeats: true },
        where: { deletedAt: null },
      }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.ACTIVE, concert: { deletedAt: null } },
      }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.CANCELED, concert: { deletedAt: null } },
      }),
    ]);

    return {
      totalSeats: seats._sum.totalSeats ?? 0,
      reserved,
      canceled,
    };
  }
}
