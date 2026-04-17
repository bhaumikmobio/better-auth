export type SessionUser = {
  id: string;
  role?: string;
  email?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

export type Session = {
  user: SessionUser;
  [key: string]: unknown;
};
