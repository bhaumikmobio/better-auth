import { PASSWORD_POLICY } from "@/constants/messages";
import { apiRequest } from "@/lib/api-client";
import type { UserRole } from "@/types/user.types";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
};

type ApiSuccessEnvelope<T> = {
  success?: boolean;
  message: string;
  data: T;
};

type GetAdminUsersResponse = ApiSuccessEnvelope<{
  users: AdminUser[];
  total: number;
}>;

export async function getAdminUsers(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUser[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  const query = searchParams.toString();
  const path = query ? `/admin/users?${query}` : "/admin/users";
  const payload = await apiRequest<GetAdminUsersResponse>(path);

  return payload.data;
}

export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  role?: UserRole;
};

export async function updateAdminUser(userId: string, payload: UpdateAdminUserPayload) {
  await apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    json: payload,
  });
}

export async function deleteAdminUser(userId: string) {
  await apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
  type CreateResponse = ApiSuccessEnvelope<AdminUser>;
  if (payload.password.length < PASSWORD_POLICY.minLength) {
    throw new Error(`Password must be at least ${PASSWORD_POLICY.minLength} characters.`);
  }
  const response = await apiRequest<CreateResponse>("/admin/users", {
    method: "POST",
    json: payload,
  });
  return response.data;
}
