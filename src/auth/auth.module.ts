import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {JwtModule} from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import {TypeOrmModule} from '@nestjs/typeorm';
import {RefreshSession} from './entities/refresh-session.entity.js';
import { RefreshSessionsService } from './refresh-sessions/refresh-sessions.service.js';

@Module({
  imports: [UsersModule,
    TypeOrmModule.forFeature([RefreshSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule, TypeOrmModule.forFeature([RefreshSession])],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { 
          algorithm: 'HS256',
          expiresIn: '15m',
          issuer: 'ecommerce-api',
          audience: 'ecommerce-client',
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: 'ecommerce-api',
          audience: 'ecommerce-client',
        }
      }),
    }),
  ],
  providers: [AuthService, AccessTokenGuard, RefreshSessionsService],
  controllers: [AuthController]
})
export class AuthModule {}
