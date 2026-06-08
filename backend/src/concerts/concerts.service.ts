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

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.concert.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Object &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundException('Concert not found');
      }
      throw error;
    }
  }

  async stats(): Promise<AdminStats> {
    const [seats, reserved, canceled] = await Promise.all([
      this.prisma.concert.aggregate({ _sum: { totalSeats: true } }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.ACTIVE },
      }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.CANCELED },
      }),
    ]);

    return {
      totalSeats: seats._sum.totalSeats ?? 0,
      reserved,
      canceled,
    };
  }
}
