import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ConcertsService } from './concerts.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get('stats')
  async stats() {
    const data = await this.concertsService.stats();
    return { data, message: 'Stats retrieved' };
  }
}
