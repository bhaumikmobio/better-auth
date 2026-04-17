import { getBackendBaseUrl } from "@/lib/auth";

type ApiRequestOptions = Omit<RequestInit, "body"> & { json?: unknown };

function toAbsoluteUrl(path: string) {
  const base = getBackendBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readErrorMessage(response: Response) {
  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") return "Request failed.";
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && typeof message[0] === "string")
      return message[0];
    return "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { json, headers, ...init } = options;
  const requestHeaders = new Headers(headers ?? {});

  if (json !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(toAbsoluteUrl(path), {
    ...init,
    headers: requestHeaders,
    credentials: init.credentials ?? "include",
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json"))
    return (await response.json()) as T;

  return undefined as T;
}
