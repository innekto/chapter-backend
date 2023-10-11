import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';

import { Response } from 'express';
@ApiTags('Auth')
@Controller({
  path: 'auth/google',
  version: '1',
})
export class AuthGoogleController {
  constructor(
    private readonly authService: AuthService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: AuthGoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<object> {
    const socialData = await this.authGoogleService.getProfileByToken(loginDto);
    const loginResponse = await this.authService.validateSocialLogin(
      'google',
      socialData,
    );

    response.cookie('refresh_token', loginResponse.refreshToken, {
      httpOnly: true,
    });

    return {
      token: loginResponse.token,
      tokenExpires: loginResponse.tokenExpires,
      user: loginResponse.user,
    };
  }
}
