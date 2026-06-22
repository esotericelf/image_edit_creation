/**
 * API base URL — set VITE_API_URL in Netlify (production) or .env.development (local).
 */
const configuredApiUrl = import.meta.env.VITE_API_URL;

if (!configuredApiUrl) {
  throw new Error("VITE_API_URL is not configured.");
}

const API_BASE_URL: string = configuredApiUrl;

export { API_BASE_URL };

/** Build a fully-qualified API path from a route fragment (e.g. `/api/v1/health`). */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${normalizedPath}`;
}

/** Authenticated API fetch — sends cookies for admin session on cross-origin requests. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
  });
}
