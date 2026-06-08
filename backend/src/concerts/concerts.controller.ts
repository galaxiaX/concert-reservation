import {
  Body,
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
import { ConcertsService } from './concerts.service';
import { CreateConcertDto } from './dto/create-concert.dto';

@Controller('concerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const data = await this.concertsService.list(user.id);
    return { data, message: 'Concerts retrieved' };
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateConcertDto) {
    const data = await this.concertsService.create(dto);
    return { data, message: 'Concert created' };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.concertsService.remove(id);
    return { data: { id }, message: 'Concert deleted' };
  }
}
