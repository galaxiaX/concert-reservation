import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/jwt-payload';
import { ReservationsService } from './reservations.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('concerts/:id/reservations')
  @Roles(Role.USER)
  @HttpCode(HttpStatus.CREATED)
  async reserve(
    @CurrentUser() user: AuthUser,
    @Param('id') concertId: string,
  ) {
    const data = await this.reservationsService.reserve(user.id, concertId);
    return { data, message: 'Reservation created' };
  }

  @Delete('reservations/:id')
  @Roles(Role.USER)
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.reservationsService.cancel(user.id, id);
    return { data, message: 'Reservation canceled' };
  }

  @Get('me/reservations')
  @Roles(Role.USER)
  async listMine(@CurrentUser() user: AuthUser) {
    const data = await this.reservationsService.listMine(user.id);
    return { data, message: 'Reservations retrieved' };
  }

  @Get('admin/reservations')
  @Roles(Role.ADMIN)
  async auditLog() {
    const data = await this.reservationsService.auditLog();
    return { data, message: 'Audit log retrieved' };
  }
}
