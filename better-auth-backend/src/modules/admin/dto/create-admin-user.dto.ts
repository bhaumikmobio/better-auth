import type { AppRole } from '../../../common/types/auth-user.type';

export type CreateAdminUserDto = {
  name: string;
  email: string;
  password: string;
  role: AppRole;
};
