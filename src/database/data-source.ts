import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity.js';
import {RefreshSession} from '../auth/entities/refresh-session.entity.js';

function requiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Environment variable not found: ${name}`);
    }

    return value;
}

export default new DataSource({
    type: 'postgres',
    host: requiredEnv('DB_HOST'),
    port: Number(requiredEnv('DB_PORT')),
    username: requiredEnv('DB_USERNAME'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_DATABASE'),
    entities: [User, RefreshSession],
    migrations: [fileURLToPath(new URL('./migrations/*.js', import.meta.url))],
    synchronize: false,
});