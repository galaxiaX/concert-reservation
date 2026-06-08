import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Reservation, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

export interface MyReservation {
  id: string;
  concertName: string;
  status: ReservationStatus;
  reservedAt: Date;
  canceledAt: Date | null;
}

export interface AuditLogRow {
  datetime: Date;
  username: string;
  concertName: string;
  action: 'Reserve' | 'Cancel';
}

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reserve one seat. Runs in a transaction that locks the concert row
   * (`SELECT ... FOR UPDATE`) so concurrent reservers serialize, then recounts
   * active reservations before inserting — no over-booking. The partial unique
   * index on `(userId, concertId) WHERE status = 'ACTIVE'` is the DB backstop;
   * a P2002 from it maps to the same duplicate 409.
   */
  async reserve(userId: string, concertId: string): Promise<Reservation> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<{ id: string; totalSeats: number }[]>`
          SELECT id, "totalSeats" FROM "Concert" WHERE id = ${concertId} FOR UPDATE
        `;
        if (locked.length === 0) {
          throw new NotFoundException('Concert not found');
        }
        const concert = locked[0];

        const existing = await tx.reservation.findFirst({
          where: { userId, concertId, status: ReservationStatus.ACTIVE },
        });
        if (existing) {
          throw new ConflictException('You already reserved this concert');
        }

        const activeCount = await tx.reservation.count({
          where: { concertId, status: ReservationStatus.ACTIVE },
        });
        if (activeCount >= concert.totalSeats) {
          throw new ConflictException('Concert is fully booked');
        }

        return tx.reservation.create({ data: { userId, concertId } });
      });
    } catch (error) {
      // Partial-unique backstop fired under a race — same intent as `existing`.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You already reserved this concert');
      }
      throw error;
    }
  }

  /**
   * Soft-cancel: mark the reservation `CANCELED` with a `canceledAt` stamp.
   * Only the owner may cancel, and only an active reservation.
   */
  async cancel(userId: string, reservationId: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own reservation');
    }
    if (reservation.status === ReservationStatus.CANCELED) {
      throw new ConflictException('Reservation is already canceled');
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.CANCELED, canceledAt: new Date() },
    });
  }

  /** Current user's own reservation history, newest first. */
  async listMine(userId: string): Promise<MyReservation[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { concert: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      concertName: r.concert.name,
      status: r.status,
      reservedAt: r.createdAt,
      canceledAt: r.canceledAt,
    }));
  }

  /**
   * Admin audit trail: an action log, not a reservation list. Each reservation
   * yields a `Reserve` row (from `createdAt`) and, if canceled, a `Cancel` row
   * (from `canceledAt`). Newest first.
   */
  async auditLog(): Promise<AuditLogRow[]> {
    const rows = await this.prisma.reservation.findMany({
      include: {
        user: { select: { name: true } },
        concert: { select: { name: true } },
      },
    });

    const log: AuditLogRow[] = [];
    for (const r of rows) {
      log.push({
        datetime: r.createdAt,
        username: r.user.name,
        concertName: r.concert.name,
        action: 'Reserve',
      });
      if (r.canceledAt) {
        log.push({
          datetime: r.canceledAt,
          username: r.user.name,
          concertName: r.concert.name,
          action: 'Cancel',
        });
      }
    }
    return log.sort((a, b) => b.datetime.getTime() - a.datetime.getTime());
  }
}
