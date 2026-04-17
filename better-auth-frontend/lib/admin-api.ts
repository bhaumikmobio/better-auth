import { apiRequest } from "@/lib/api-client";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
};

type GetAdminUsersResponse = {
  message: string;
  data: {
    users: AdminUser[];
    total: number;
  };
};

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
