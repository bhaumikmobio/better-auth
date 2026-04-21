import type { AppRole } from '../../../common/types/auth-user.type';

export type UpdateAdminUserDto = {
  name?: string;
  email?: string;
  role?: AppRole;
};
