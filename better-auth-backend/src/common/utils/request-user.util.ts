import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AUTHENTICATION_REQUIRED_MESSAGE } from '../constants/app.constants';

export const requireAuthenticatedUserId = (request: Request): string => {
  const userId = request.user?.id;
  if (!userId) {
    throw new UnauthorizedException(AUTHENTICATION_REQUIRED_MESSAGE);
  }
  return userId;
};
