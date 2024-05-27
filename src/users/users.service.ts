import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition } from 'src/utils/types/entity-condition.type';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { DeepPartial, IsNull, Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { NullableType } from '../utils/types/nullable.type';
import { UpdatePasswordDto } from './dto/update-password.dto';
import bcrypt from 'bcryptjs';
import { createResponse } from 'src/helpers/response-helpers';
import { MyGateway } from 'src/sockets/gateway/gateway';

import { NotaService } from 'src/nota/nota.service';
import { notaUser } from 'src/nota/helpers/nota.user';
import { createResponseUser } from 'src/helpers';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private readonly myGateway: MyGateway,
    private readonly notaService: NotaService,
  ) {}

  async searchUsers(
    userId: number,
    query: string,
  ): Promise<DeepPartial<User[]> | { message: string }> {
    const currentUser = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      relations: ['subscribers'],
    });

    const matchingUsers = await this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.avatarUrl',
        'user.nickName',
        'user.firstName',
        'user.lastName',
      ])
      .where('user.nickName LIKE :part', { part: `%${query}%` })
      .andWhere('user.id != :userId', { userId: userId })
      .getMany();

    if (matchingUsers.length === 0) {
      return { message: 'Users not found' };
    }

    const usersWithSubscriptionInfo = matchingUsers.map((user) => ({
      ...user,
      isSubscribed: currentUser.subscribers.some((sub) => sub.id === user.id),
    }));

    return usersWithSubscriptionInfo;
  }

  create(createProfileDto: CreateUserDto): Promise<User> {
    return this.usersRepository.save(
      this.usersRepository.create(createProfileDto),
    );
  }

  findManyWithPagination(
    paginationOptions: IPaginationOptions,
  ): Promise<User[]> {
    return this.usersRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });
  }

  findOne(
    fields: EntityCondition<User>,
    relations: string[] = [],
  ): Promise<NullableType<User>> {
    return this.usersRepository.findOne({
      where: fields,
      relations,
    });
  }

  async findOneByDelete(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      withDeleted: true,
      where: {
        email: email,
        deletedAt: Not(IsNull()),
      },
    });
  }

  async findDeletedUserByCondition(
    fields: EntityCondition<User>,
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      withDeleted: true,
      where: {
        ...fields,
        deletedAt: Not(IsNull()),
      },
    });
  }

  async update(userId: number, updateProfileDto: DeepPartial<User>) {
    const user = await this.findOne(
      {
        id: userId,
      },
      ['posts', 'subscribers', 'books'],
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this user.',
      );
    }

    Object.assign(user, updateProfileDto);

    const subscribersCount = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.subscribers', 'subscriber')
      .select('COUNT(subscriber.id)', 'subscribersCount')
      .where('subscriber.id = :userId', { userId: user.id })
      .getRawOne();

    const savedUser = await this.usersRepository.save(user);

    const responeUser = createResponseUser(
      savedUser,
      +subscribersCount.subscribersCount,
      false,
    );
    return responeUser;
  }

  async softDelete(id: User['id']): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  async toggleSubscription(
    currentUserId: number,
    targetUserId: number,
  ): Promise<User> {
    const targetUser = await this.usersRepository.findOneByOrFail({
      id: targetUserId,
    });

    const currentUser = await this.usersRepository.findOneOrFail({
      where: { id: currentUserId },
      relations: ['subscribers'],
    });

    if (currentUserId === targetUserId) {
      throw new ConflictException({
        error: 'You cannot subscribe to yourself!',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const isSubscribed = currentUser.subscribers.some(
      (subscriber) => subscriber.id === targetUserId,
    );

    currentUser.subscribers = isSubscribed
      ? currentUser.subscribers.filter(
          (subscriber) => subscriber.id !== targetUserId,
        )
      : [...currentUser.subscribers, targetUser];

    await currentUser.save();

    const notificationMessage = isSubscribed
      ? 'Unsubscribed from you'
      : 'Subscribed to you';

    await this.notaService.create(
      {
        message: notificationMessage,
        user: {
          ...notaUser(currentUser),
        },
      },
      targetUser,
    );

    this.myGateway.sendNotificationToUser(
      {
        ...notaUser(currentUser),
      },
      targetUserId,
      notificationMessage,
    );

    return currentUser;
  }

  async me(userId: number): Promise<Partial<User>> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      relations: ['books'],
    });

    const followingAndFollowersCount = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin(
        'User2user(friends)',
        'following',
        'following.userId_1 = user.id',
      )
      .leftJoin(
        'User2user(friends)',
        'followers',
        'followers.userId_2 = user.id',
      )
      .select('COUNT(DISTINCT following.userId_2)', 'followingCount')
      .addSelect('COUNT(DISTINCT followers.userId_1)', 'followersCount')
      .where('user.id = :userId', { userId })
      .getRawOne();

    console.log('followingAndFollowersCount :>> ', followingAndFollowersCount);
    const { followersCount, followingCount } = followingAndFollowersCount;

    return createResponseUser(user, +followersCount, false, +followingCount);
  }

  async getGuestsUserInfo(
    userId: number,
    guestId: number,
  ): Promise<Partial<object>> {
    const guest = await this.usersRepository.findOneByOrFail({ id: guestId });
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      relations: ['subscribers', 'books'],
    });

    const subscribers = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.subscribers', 'subscriber')
      .select('user.id')
      .where('subscriber.id=:userId', { userId })
      .getRawMany();

    const isSubscribed = subscribers.some(
      (subscriber) => subscriber.user_id === guest.id,
    );

    return {
      avatarUrl: user.avatarUrl,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      location: user.location,
      userStatus: user.userStatus,
      myFollowersCount: subscribers.length ?? null,
      myFollowingCount: user.subscribers.length ?? null,
      userBooks: user.books,
      isSubscribed: isSubscribed,
    };
  }

  async updatePassword(userId: number, updtePasswordDto: UpdatePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw createResponse(HttpStatus.NOT_FOUND, 'User not found.');
    }
    const { oldPassword, newPassword, repeatNewPassword } = updtePasswordDto;

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      throw createResponse(HttpStatus.BAD_REQUEST, 'Incorrect old password!');
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      throw createResponse(
        HttpStatus.BAD_REQUEST,
        'The new password must be different from the old one!',
      );
    }

    if (newPassword !== repeatNewPassword) {
      throw createResponse(
        HttpStatus.BAD_REQUEST,
        'Both passwords must match!',
      );
    }

    user.password = newPassword;
    await this.usersRepository.save(user);

    // Успішна відповідь
    return createResponse(
      HttpStatus.OK,
      'Password updated successfully',
      false,
    );
  }

  async getMyFollowWithPagination(
    userId: number,
    page: number,
    limit: number,
  ): Promise<object> {
    const user = await this.findOne(
      {
        id: userId,
      },
      ['subscribers'],
    );
    if (!user) {
      throw new Error('User not found');
    }
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedFollow = user.subscribers.slice(startIndex, endIndex);
    return {
      myFollow: paginatedFollow,
      page,
      limit,
      total: user.subscribers.length,
    };
  }

  async getMyFollowersWithPagination(
    userId: number,
    page: number,
    limit: number,
  ): Promise<object> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      relations: ['subscribers'],
    });

    if (page <= 0 || limit <= 0) {
      throw createResponse(HttpStatus.BAD_REQUEST, 'Invalid page or limit.');
    }

    const myFollowers = await this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.nickName',
        'user.location',
        'user.avatarUrl',
      ])
      .leftJoin('user.subscribers', 'subscriber')
      .where('subscriber.id=:userId', { userId: user.id })
      .getMany();

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedFollowers = myFollowers.slice(startIndex, endIndex);

    return {
      myFollowers: paginatedFollowers.map((fol) => {
        return {
          ...fol,
          isSubscribed: user.subscribers.some((sub) => sub.id === fol.id),
        };
      }),
    };
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.findOne({ id: id });

    if (!user) {
      throw createResponse(HttpStatus.NOT_FOUND, 'User not found.');
    }

    await this.usersRepository.remove(user);
  }

  async findAllDeletedUsers(): Promise<User[]> {
    return this.usersRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
    });
  }

  async restoringUser(id: number) {
    await this.usersRepository.restore(id);
  }
}
