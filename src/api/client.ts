/**
 * Production API base URL (Netlify: set VITE_API_URL to your public NAS/server endpoint).
 * Development falls back to the local Docker-published host port.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8001";

/** Build a fully-qualified API path from a route fragment (e.g. `/api/v1/health`). */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${normalizedPath}`;
}
