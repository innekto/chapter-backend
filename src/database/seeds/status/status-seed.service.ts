import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookStatus } from 'src/book/entities/book-status.entity';
import { Status } from 'src/statuses/entities/status.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { Repository } from 'typeorm';
import { bookStatus } from '../book/book.status';

@Injectable()
export class StatusSeedService {
  constructor(
    @InjectRepository(Status)
    private repository: Repository<Status>,
    @InjectRepository(BookStatus)
    private bookStatusRepository: Repository<BookStatus>,
  ) {}

  async run() {
    const count = await this.repository.count();

    if (!count) {
      await this.repository.save([
        this.repository.create({
          id: StatusEnum.active,
          name: 'Active',
        }),
        this.repository.create({
          id: StatusEnum.inactive,
          name: 'Inactive',
        }),
      ]);
    }
  }

  async setBookStatus() {
    const count = await this.bookStatusRepository.count();

    if (count === 0) {
      const promises = bookStatus.map(async (bs) => {
        const status = new BookStatus();
        status.name = bs;
        return this.bookStatusRepository.save(status);
      });

      await Promise.all(promises);
    }
  }
}
