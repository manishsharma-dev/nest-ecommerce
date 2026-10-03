import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import * as argon2 from 'argon2';
import { QueryFailedError } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import type { LoginDto } from './dto/login.dto.js';
import { RefreshSessionsService } from './refresh-sessions/refresh-sessions.service.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly refreshSessionsService: RefreshSessionsService
    ) { }

    async register(dto: RegisterDto) {

        const name = dto.name.trim();
        const email = dto.email.trim().toLowerCase();

        if (!name) {
            throw new BadRequestException('Name must not be blank');
        }

        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
            throw new ConflictException('Email is already registered');
        }

        const passwordHash = await argon2.hash(dto.password,
            {
                type: argon2.argon2id,
            }
        );

        try {
            const user = await this.usersService
                .createUser(name, email, passwordHash);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            }
        }
        catch (error) {
            if (
                error instanceof QueryFailedError &&
                'code' in error.driverError &&
                error.driverError.code === '23505'
            ) {
                throw new ConflictException('Email is already registered');
            }
            throw error;
        }

    }

    async login(dto: LoginDto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmailWithPassword(email);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatches = await argon2.verify(user.passwordHash, dto.password);

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
        });

        const session = await this.refreshSessionsService.create(user.id);

        return {
            accessToken,
            refreshToken: session.refreshToken,
            refreshTokenExpiresAt: session.expiresAt,
            tokenType: 'Bearer',
            expiresIn: 900,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            }
        };
    }

    async getMe(userId: string) {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        };
    }

    async refresh(refreshToken: string) {
        const session = await
            this.refreshSessionsService.rotate(refreshToken);

        const accessToken = await this.jwtService.signAsync({
            sub: session.userId,
        });

        return {
            accessToken,
            refreshToken: session.refreshToken,
            refreshTokenExpiresAt: session.expiresAt,
            tokenType: 'Bearer',
            expiresIn: 900,
        };
    }

    async logout(refreshToken: string): Promise<void> {
        await this.refreshSessionsService.revoke(refreshToken);
    }

    async logoutAll(userId: string): Promise<void> {
        await this.refreshSessionsService.revokeAllForUser(userId);
    }
}
