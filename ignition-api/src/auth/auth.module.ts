import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionModule } from '../session/session.module';
import { AuthChallengeController } from './auth-challenge.controller';
import { AuthVerifyController } from './auth-verify.controller';
import { AuthLogoutController } from './auth-logout.controller';
import { AuthRefreshController } from './auth-refresh.controller';
import { AuthTokenService } from './auth-token.service';
import { AuthChallengeService } from './auth-challenge.service';
import { JwtMiddleware } from './jwt.middleware';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'stellaraid-default-secret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    PrismaModule,
    CacheModule,
    SessionModule,
  ],
  controllers: [
    AuthChallengeController,
    AuthVerifyController,
    AuthLogoutController,
    AuthRefreshController,
  ],
  providers: [AuthTokenService, AuthChallengeService, JwtMiddleware],
  exports: [JwtModule, AuthTokenService, JwtMiddleware],
})
export class AuthModule {}
