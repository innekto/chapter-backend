import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { UsersModule } from 'src/users/users.module';
import { ForgotModule } from 'src/forgot/forgot.module';
import { MailModule } from 'src/mail/mail.module';
import { IsExist } from 'src/helpers/validators/is-exists.validator';
import { IsNotExist } from 'src/helpers/validators/is-not-exists.validator';
import { SessionModule } from 'src/session/session.module';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Forgot } from 'src/forgot/entities/forgot.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    UsersModule,
    ForgotModule,
    SessionModule,
    PassportModule,
    MailModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([Forgot, User]),
  ],
  controllers: [AuthController],
  providers: [
    IsExist,
    IsNotExist,
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
