import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Status } from 'src/statuses/entities/status.entity';
import { StatusSeedService } from './status-seed.service';
import { BookStatus } from 'src/book/entities/book-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Status, BookStatus])],
  providers: [StatusSeedService],
  exports: [StatusSeedService],
})
export class StatusSeedModule {}
