import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export class IClientInfo {
  ip: string;
  userAgent: string;
}

export const ClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IClientInfo => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // Lấy IP (Ưu tiên lấy qua Proxy x-forwarded-for)
    const xForwardedFor = request.headers['x-forwarded-for'];
    const ip = typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0].trim()
      : request.ip || request.socket.remoteAddress || '';

    // Lấy User-Agent (Thiết bị/Trình duyệt)
    const userAgent = request.headers['user-agent'] || '';

    return { ip, userAgent };
  },
);
