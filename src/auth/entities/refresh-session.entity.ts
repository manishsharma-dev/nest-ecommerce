import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity.js';

@Entity('refresh_sessions')
export class RefreshSession {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'varchar', length: 64, unique: true, select: false })
    tokenHash!: string;

    @Column({ type: 'timestamptz' })
    expiresAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    revokedAt!: Date | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;
}