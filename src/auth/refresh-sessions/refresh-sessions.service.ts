import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { User } from '../../users/user.entity.js';
import { RefreshSession } from '../entities/refresh-session.entity.js';

@Injectable()
export class RefreshSessionsService {
  constructor(
    @InjectRepository(RefreshSession)
    private readonly sessionsRepository: Repository<RefreshSession>,
  ) { }

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
      familyId: randomUUID(),
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

  async rotate(refreshToken: string) {
    if (!/^[a-f0-9]{64}$/.test(refreshToken)) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    return this.sessionsRepository.manager.transaction(
      'READ COMMITTED',
      async (manager) => {
        const repository = manager.getRepository(RefreshSession);

        // Find the owner before acquiring locks.
        const candidate = await repository.findOne({
          where: { tokenHash },
        });

        if (!candidate) {
          throw new UnauthorizedException('Invalid or expired refresh token');
        }

        await this.lockUser(manager, candidate.userId);

        // Read again after obtaining the user lock.
        const currentSession = await repository
          .createQueryBuilder('session')
          .where('session.id = :id', { id: candidate.id })
          .setLock('pessimistic_write')
          .getOne();

        const now = new Date();

        if (
          !currentSession ||
          currentSession.revokedAt !== null ||
          currentSession.expiresAt.getTime() <= now.getTime()
        ) {
          throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const nextRefreshToken = randomBytes(32).toString('hex');
        const nextTokenHash = createHash('sha256')
          .update(nextRefreshToken)
          .digest('hex');

        currentSession.revokedAt = now;
        await repository.save(currentSession);

        const nextSession = repository.create({
          userId: currentSession.userId,
          familyId: currentSession.familyId,
          tokenHash: nextTokenHash,
          expiresAt: currentSession.expiresAt,
          revokedAt: null,
        });

        await repository.save(nextSession);

        return {
          userId: currentSession.userId,
          refreshToken: nextRefreshToken,
          expiresAt: nextSession.expiresAt,
        };
      },
    );
  }

  async revoke(refreshToken: string): Promise<void> {
    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.sessionsRepository.manager.transaction(
      'READ COMMITTED',
      async (manager) => {
        const repository = manager.getRepository(RefreshSession);

        const session = await repository.findOne({
          where: { tokenHash },
        });

        if (!session) {
          return;
        }

        await this.lockUser(manager, session.userId);

        await repository.update(
          {
            userId: session.userId,
            familyId: session.familyId,
            revokedAt: IsNull(),
          },
          {
            revokedAt: new Date(),
          },
        );
      },
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessionsRepository.manager.transaction(
      'READ COMMITTED',
      async (manager) => {
        await this.lockUser(manager, userId);

        await manager.getRepository(RefreshSession).update(
          {
            userId,
            revokedAt: IsNull(),
          },
          {
            revokedAt: new Date(),
          },
        );
      },
    );
  }

  private async lockUser(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    const user = await manager
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .setLock('pessimistic_write')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
  }
}