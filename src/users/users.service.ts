import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email }
        });
    }

    findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { id }
        });
    }

    findByEmailWithPassword(email: string): Promise<User | null> {
        return this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email })
        .getOne();
    }

    async createUser(name: string, email: string, passwordHash: string): Promise<User> {
        const user = this.usersRepository.create({
            name,
            email,
            passwordHash,
        });

        return this.usersRepository.save(user);
    }
}
