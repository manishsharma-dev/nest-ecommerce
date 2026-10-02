import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { RefreshSession } from '../entities/refresh-session.entity.js';

@Injectable()
export class RefreshSessionsService {
  constructor(
    @InjectRepository(RefreshSession)
    private readonly sessionsRepository: Repository<RefreshSession>,
  ) {}

  async create(userId: string) {
    const refreshToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    const session = this.sessionsRepository.create({
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
    });

    await this.sessionsRepository.save(session);

    return {
      refreshToken,
      expiresAt,
    };
  }
}