import { SetMetadata } from '@nestjs/common';
import type { AppRole } from '../types/auth-user.type';

export const ROLES_KEY = 'roles';

// Attach allowed roles to route handlers/classes for RolesGuard checks.
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
