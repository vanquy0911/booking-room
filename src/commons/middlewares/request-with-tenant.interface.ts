import { Request } from 'express';

export interface RequestWithTenant extends Request {
    orgId?: string;
    membership?: any;
    user?: any;
}