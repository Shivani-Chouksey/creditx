import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map } from 'rxjs/operators';

/**
 * Global response envelope.
 *
 * Wraps every successful response as:
 *   { success, statusCode, message, data, [meta] }
 *
 * Rules:
 *  - If the handler returns `{ data, meta }`, both fields are kept
 *    so pagination metadata reaches the client unchanged.
 *  - If the handler returns `{ message, data }`, the message is
 *    surfaced on the envelope and `data` is forwarded.
 *  - Anything else is placed verbatim under `data`.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((payload) => {
        const envelope: Record<string, any> = {
          success:    true,
          statusCode: response.statusCode,
          message:    payload?.message ?? 'Success',
        };

        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          // Paginated shape: preserve both `data` and `meta`.
          if ('data' in payload && 'meta' in payload) {
            envelope.data = (payload as any).data;
            envelope.meta = (payload as any).meta;
            return envelope;
          }
          // Handler returned `{ message?, data }`
          if ('data' in payload) {
            envelope.data = (payload as any).data;
            return envelope;
          }
        }

        envelope.data = payload;
        return envelope;
      }),
    );
  }
}
