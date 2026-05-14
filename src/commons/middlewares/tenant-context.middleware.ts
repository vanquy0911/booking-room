import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrganizationMember } from '../../modules/organization/entities/organization_members.entity';
import { RequestWithTenant } from './request-with-tenant.interface';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,

        @InjectRepository(OrganizationMember)
        private readonly memberRepo: Repository<OrganizationMember>,
    ) { }

    async use(
        req: RequestWithTenant,
        res: Response,
        next: NextFunction,
    ) {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Missing authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        let payload: any;

        try {
            payload = await this.jwtService.verifyAsync(token);
        } catch {
            throw new UnauthorizedException('Invalid token');
        }

        req.user = payload;

        /**
         * Ưu tiên lấy org từ header
         */
        const orgId =
            (req.headers['x-org-id'] as string) || payload.orgId;

        if (!orgId) {
            throw new ForbiddenException('Organization not found');
        }

        /**
         * Verify user thuộc organization
         */
        const membership = await this.memberRepo.findOne({
            where: {
                userId: payload.sub,
                organizationId: orgId,
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this organization',
            );
        }

        /**
         * Attach vào request
         */
        req.orgId = orgId;
        req.membership = membership;

        next();
    }
}