import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { PostDto } from './dto/post.dto';
import { User } from '../users/entities/user.entity';
import { UpdatePostDto } from './dto/updatePost.dto';
import { Like } from 'src/like/entity/like.entity';

import { MyGateway } from 'src/sockets/gateway/gateway';
import { transformPostInfo } from './ helpers/post.transform';
import { CommentService } from 'src/comment/comment.service';
import { notaUser } from 'src/nota/helpers/nota.user';
import { NotaService } from 'src/nota/nota.service';
import { CommentEntity } from 'src/comment/entity/comment.entity';
import { mapUserToResponse } from './ helpers/users-who-liked-post.response';
import { limitedParallel } from './limitedParallel';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,

    private commentService: CommentService,

    private readonly myGateway: MyGateway,
    private readonly notaService: NotaService,
  ) {}

  async create(author: User, createPostDto: PostDto) {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: author.id },
    });
    const post = new PostEntity(createPostDto);

    post.author = user;

    const notificationMessage = 'New post';

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.id AS id')
      .leftJoin('user.subscribers', 'subscribers')
      .where('user.id != :authorId', { authorId: author.id })
      .andWhere('subscribers.id = :userId', { userId: user.id })
      .orderBy('user.id')
      .getRawMany();

    const newPost = await this.postRepository.save(post);
    await this.createAndSendNotes(
      newPost.id,
      newPost.author,
      users,
      notificationMessage,
    );

    return newPost;
  }

  async updatePost(
    userId: number,
    postId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<void> {
    const post = await this.postRepository.findOneOrFail({
      where: { id: postId, author: { id: userId } },
    });

    await this.postRepository.update(post.id, updatePostDto);
  }

  async deletePost(userId: number, postId: number): Promise<void> {
    const post = await this.postRepository.findOneOrFail({
      where: { id: postId, author: { id: userId } },
    });

    await this.postRepository.remove(post);
  }

  async getPostById(postId: number, userId: number) {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      relations: ['subscribers'],
    });
    const postInfo = await this.commentService.deepGetPostById(postId);

    if (!postInfo) {
      throw new NotFoundException('Post not found');
    }

    const transformedResponse = transformPostInfo([postInfo], user);
    return transformedResponse[0];
  }

  async getPostsByAuthor(
    authorId: number,
    page: number,
    limit: number,
  ): Promise<DeepPartial<PostEntity[]>> {
    const user = await this.usersRepository.findOneByOrFail({ id: authorId });
    const postsInfo = await this.getPostsByUserId(authorId);

    const transformedResponse = transformPostInfo(postsInfo, user);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPosts = transformedResponse.slice(startIndex, endIndex);
    return paginatedPosts;
  }

  async getUsersPosts(
    userId: number,
    page: number,
    limit: number,
  ): Promise<DeepPartial<PostEntity[]>> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const postsInfo = await this.getPostsByUserId(userId);

    const transformedResponse = transformPostInfo(postsInfo, user);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPosts = transformedResponse.slice(startIndex, endIndex);
    return paginatedPosts;
  }

  async getUsersWhoLikedPost(
    userId: number,
    postId: number,
  ): Promise<DeepPartial<User[]>> {
    const currentUser = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      relations: ['subscribers'],
    });

    const post = await this.postRepository.findOneOrFail({
      where: { id: postId },
    });

    const allUsers = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin(Like, 'like', 'like.userId=user.id')
      .where('like.postId=:postId', { postId: post.id })
      .andWhere('user.id != :userId', { userId: userId })
      .getMany();

    const response = allUsers.map((user) =>
      mapUserToResponse(user, currentUser),
    );
    return response;
  }

  async getLikedAndComentedPosts(
    currentUserId: number,
    page: number,
    limit: number,
  ) {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: currentUserId },
      relations: ['subscribers'],
    });

    const likedAndCommentedPosts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.likes', 'like', 'like.userId = :userId', {
        userId: user.id,
      })
      .leftJoin('post.comments', 'comment', 'comment.userId = :userId', {
        userId: user.id,
      })
      .where('like.userId = :userId OR comment.userId = :userId')
      .setParameter('userId', user.id)
      .select('DISTINCT post.id')
      .getRawMany();

    const ids = likedAndCommentedPosts.map((post) => post.id);

    const postInfo: PostEntity[] = await this.getPostInfo(ids, undefined);

    const transformedResponse = transformPostInfo(postInfo, user);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedPosts = transformedResponse.slice(startIndex, endIndex);

    return paginatedPosts;
  }

  private async getPostsByUserId(userId: number) {
    const postsInfo: PostEntity[] = await this.getPostInfo(undefined, userId);
    return postsInfo;
  }

  private async createAndSendNotes(
    postId: number,
    postAuthor: User,
    users: User[],
    message: string,
  ) {
    const createNotaForUser = async (user: User) => {
      return await this.notaService.create(
        {
          message: message,
          ...notaUser(postAuthor, postId),
        },
        user,
      );
    };

    const concurrencyLimit = 5;
    await limitedParallel(
      users.map((user) => () => {
        return createNotaForUser(user);
      }),
      concurrencyLimit,
    );

    this.myGateway.sendNotificationToAllUsers(
      {
        ...notaUser(postAuthor, postId),
      },
      message,
    );
  }

  private async getPostInfo(
    ids?: number[],
    userId?: number,
  ): Promise<PostEntity[]> {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .addSelect([
        'author.id',
        'author.avatarUrl',
        'author.firstName',
        'author.lastName',
        'author.nickName',
      ])
      .leftJoinAndSelect('post.likes', 'like')
      .leftJoinAndSelect('post.comments', 'comment')
      .leftJoinAndSelect('comment.user', 'commentAuthor')
      .leftJoinAndSelect('comment.likes', 'likes')
      .where('like.comment IS NULL')
      .orderBy('post.createdAt', 'DESC');

    if (ids) {
      queryBuilder.andWhere('post.id IN (:...ids)', { ids });
    }

    if (userId) {
      queryBuilder.andWhere('author.id = :userId', { userId });
      queryBuilder.addOrderBy('comment.createdAt', 'DESC');
    }

    return queryBuilder.getMany();
  }
}
