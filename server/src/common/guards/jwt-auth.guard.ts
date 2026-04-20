import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * JWT access-token guard.
 *
 * Extracts the token from EITHER source (spec requirement):
 *  1. Authorization: Bearer <token> header
 *  2. HTTP-only cookie named "accessToken"
 *
 * The header takes precedence — if both are present the Bearer
 * token is used.  The guard verifies the token with JwtService,
 * attaches `req.user = { userId, email, role }`, and 401s on any
 * failure.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Access token missing');
    }

    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    (req as any).user = {
      userId: String(payload.sub ?? payload.userId ?? ''),
      email:  payload.email,
      role:   payload.role ?? 'user',
    };

    if (!(req as any).user.userId) {
      throw new UnauthorizedException('Malformed token payload');
    }

    return true;
  }

  /** Pulls the access token from Authorization header or cookie. */
  private extractToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      return header.substring(7).trim() || null;
    }

    // Fallback: HTTP-only cookie named "accessToken"
    const cookieToken = (req as any).cookies?.accessToken;
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      return cookieToken;
    }

    return null;
  }
}
