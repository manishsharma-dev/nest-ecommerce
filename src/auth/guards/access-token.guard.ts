import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import {
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type AuthenticatedRequest = Request &
{
    userId: string
};

@Injectable()
export class AccessTokenGuard implements CanActivate {

    constructor(private readonly jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        const authorization = request.headers.authorization;
        const match = authorization?.match(/^Bearer (\S+)$/i);

        if(!match) {
            throw new UnauthorizedException('Missing or invalid access token');
        }

        try{
            const payload = await this.jwtService.verifyAsync<{
                    sub?: unknown;
                }>(match[1]);
            if(typeof payload.sub !== 'string' ||
                !payload.sub) {
                    throw new UnauthorizedException();
            }

            request.userId = payload.sub;
            return true;
        }
        catch (error) {
            throw new UnauthorizedException('Invalid access token');
        }
    }
}