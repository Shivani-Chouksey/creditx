import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: string;
  email:  string;
  role:   string;
}

/**
 * @CurrentUser() — extracts the authenticated user from the request.
 *
 * Usage:
 *   @CurrentUser() user: RequestUser          → full user object
 *   @CurrentUser('userId') id: string         → single field
 */
export const CurrentUser = createParamDecorator(
  (field: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const user: RequestUser = ctx.switchToHttp().getRequest().user;
    return field ? user?.[field] : user;
  },
);