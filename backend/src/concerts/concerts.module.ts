import { Module } from '@nestjs/common';
import { ConcertsController } from './concerts.controller';
import { AdminController } from './admin.controller';
import { ConcertsService } from './concerts.service';

@Module({
  controllers: [ConcertsController, AdminController],
  providers: [ConcertsService],
})
export class ConcertsModule {}
