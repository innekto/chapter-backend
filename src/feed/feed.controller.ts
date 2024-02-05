import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedService } from './feed.service';
// import { FeedGateway } from './gateway/feet.gateway';
import { AuthGuard } from '@nestjs/passport';
import {FeedGateway} from './gateway/feet.gateway'

@ApiTags('feed')
@Controller({
  version: '1',
})
export class FeedController {
  constructor(
    private readonly feedService: FeedService, 
    private readonly Gateway: FeedGateway,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get a feed' })
  @Get('feed')
  async getFeed(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.feedService.getFeed(req.user.id, page, limit)
    .then((posts) => {
      this.Gateway.server.emit('GetPosts', posts);
      return posts
    }).then((updateLikeCount) =>{
      this.Gateway.server.emit('updateLikeCount',updateLikeCount)
      return updateLikeCount
    })
  }

  //response for swagger
  // @ApiBearerAuth()
  // @UseGuards(AuthGuard('jwt'))
  // @ApiOperation({ summary: 'Get a feed' })
  // @Get('feed')
  // async getFeed(@Request() req): Promise<any> {
  //   const posts = await this.feedService.getFeed(req.user.id);
  //   this.Gateway.server.emit('GetPosts', posts);

  //   return posts;
  // }
}
