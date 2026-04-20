import type { Session } from "@/types/auth.types";

type GetSessionArgs = {
  headers: Pick<Headers, "get">;
};

export function getAuthBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? "http://localhost:3001";
  return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

export function getBackendBaseUrl() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (apiBase) return apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;

  const authBase = getAuthBaseUrl();
  return authBase.endsWith("/auth") ? authBase.slice(0, -5) : authBase;
}

export function getSessionEndpoint() {
  const authBase = getAuthBaseUrl();
  const normalizedAuthBase = authBase.endsWith("/auth") ? authBase : `${authBase}/auth`;
  return `${normalizedAuthBase}/get-session`;
}

export function parseSessionPayload(payload: unknown): Session | null {
  if (!payload || typeof payload !== "object") return null;

  const directUser = (payload as { user?: unknown }).user;
  if (directUser && typeof directUser === "object") {
    return payload as Session;
  }

  const nestedData = (payload as { data?: unknown }).data;
  if (nestedData && typeof nestedData === "object" && "user" in nestedData) {
    return nestedData as Session;
  }

  return null;
}

export function hasRole(roleValue: string | undefined, requiredRole: string): boolean {
  if (!roleValue) return false;
  return roleValue
    .split(",")
    .map((role) => role.trim())
    .includes(requiredRole);
}

export const auth = {
  api: {
    // This mirrors auth.api.getSession(...) shape for server-side helpers.
    async getSession({ headers }: GetSessionArgs): Promise<Session | null> {
      const cookieHeader = headers.get("cookie");
      if (!cookieHeader) {
        return null;
      }

      let response: Response;
      try {
        response = await fetch(getSessionEndpoint(), {
          method: "GET",
          headers: {
            cookie: cookieHeader,
          },
          cache: "no-store",
        });
      } catch {
        // Gracefully handle temporary auth/backend unavailability.
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const payload: unknown = await response.json();
      return parseSessionPayload(payload);
    },
  },
};
