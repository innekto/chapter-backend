import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { addDays } from 'date-fns';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'findDeletingUsersMoreThan30DaysAgo',
    timeZone: 'Europe/Kyiv',
  })
  async handleCron(): Promise<void> {
    const currentDate = new Date();
    const thirtyDaysAgo = addDays(currentDate, -30);

    const usersIncludingDeleted = await this.usersService.findAllDeletedUsers();

    for (const user of usersIncludingDeleted) {
      if (user.deletedAt && user.deletedAt < thirtyDaysAgo) {
        await this.userRepository.delete(user.id);
      }
    }
  }
}
