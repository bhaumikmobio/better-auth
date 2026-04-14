import { headers } from "next/headers";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type SessionPayload = {
  user: SessionUser;
};

export type ServerSessionState =
  | { status: "authenticated"; session: SessionPayload }
  | { status: "unauthenticated"; session: null }
  | { status: "unknown"; session: null };

function getAuthBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_AUTH_BASE_URL ??
    "http://localhost:3001";

  return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

function extractSessionPayload(data: unknown): SessionPayload | null {
  if (!data || typeof data !== "object") return null;

  const directUser = (data as { user?: unknown }).user;
  if (directUser && typeof directUser === "object") {
    return { user: directUser as SessionUser };
  }

  const nested = (data as { data?: unknown }).data;
  if (!nested || typeof nested !== "object") return null;

  const nestedUser = (nested as { user?: unknown }).user;
  if (nestedUser && typeof nestedUser === "object") {
    return { user: nestedUser as SessionUser };
  }

  return null;
}

export async function getServerSessionState(): Promise<ServerSessionState> {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  if (!cookieHeader) {
    return { status: "unknown", session: null };
  }

  try {
    const response = await fetch(`${getAuthBaseUrl()}/auth/get-session`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { status: "unauthenticated", session: null };
    }
    if (!response.ok) {
      return { status: "unknown", session: null };
    }

    const payload: unknown = await response.json();
    const session = extractSessionPayload(payload);
    if (session?.user) {
      return { status: "authenticated", session };
    }
    return { status: "unauthenticated", session: null };
  } catch {
    return { status: "unknown", session: null };
  }
}
