import { apiUrl } from "../../api/client";
import type {
  ApiErrorDetail,
  GenerateRequestPayload,
  GenerateResponse,
  GiftTokenCreateResponse,
  GiftTokenStatusResponse,
} from "./types";

export class GenerateApiError extends Error {
  readonly status: number;
  readonly detail?: ApiErrorDetail;

  constructor(message: string, status: number, detail?: ApiErrorDetail) {
    super(message);
    this.name = "GenerateApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function parseJsonError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      detail?: ApiErrorDetail | string | unknown;
    };
    const { detail } = body;

    if (typeof detail === "string") {
      return detail;
    }

    if (detail && typeof detail === "object" && detail !== null) {
      const parsed = detail as ApiErrorDetail;
      if (parsed.message) return parsed.message;
    }
  } catch {
    /* fall through */
  }
  return `Request failed with status ${response.status}`;
}

export async function generateImage(
  payload: GenerateRequestPayload,
  options?: { signal?: AbortSignal; giftToken?: string; isAdmin?: boolean },
): Promise<GenerateResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.giftToken) {
    headers["X-Gift-Token"] = options.giftToken;
  }
  if (options?.isAdmin) {
    headers["X-Admin-Request"] = "true";
  }

  const response = await fetch(apiUrl("/api/v1/generate"), {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      ...payload,
      ...(options?.giftToken ? { gift_token: options.giftToken } : {}),
      ...(options?.isAdmin ? { is_admin: true } : {}),
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const message = await parseJsonError(response);
    throw new GenerateApiError(message, response.status);
  }

  return (await response.json()) as GenerateResponse;
}

export async function adminLogin(password: string): Promise<void> {
  const response = await fetch(apiUrl("/api/v1/admin/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    throw new GenerateApiError(await parseJsonError(response), response.status);
  }
}

export async function adminLogout(): Promise<void> {
  await fetch(apiUrl("/api/v1/admin/logout"), {
    method: "POST",
    credentials: "include",
  });
}

export async function checkAdminSession(): Promise<boolean> {
  const response = await fetch(apiUrl("/api/v1/admin/session"), { credentials: "include" });
  if (!response.ok) return false;
  const body = (await response.json()) as { authenticated?: boolean };
  return Boolean(body.authenticated);
}

export async function generateGiftToken(): Promise<GiftTokenCreateResponse> {
  const response = await fetch(apiUrl("/api/v1/admin/generate-token"), {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new GenerateApiError(await parseJsonError(response), response.status);
  }
  return (await response.json()) as GiftTokenCreateResponse;
}

export async function listGiftTokens(): Promise<GiftTokenCreateResponse[]> {
  const response = await fetch(apiUrl("/api/v1/admin/tokens"), { credentials: "include" });
  if (!response.ok) {
    throw new GenerateApiError(await parseJsonError(response), response.status);
  }
  return (await response.json()) as GiftTokenCreateResponse[];
}

export async function fetchGiftTokenStatus(
  token: string,
): Promise<GiftTokenStatusResponse> {
  const response = await fetch(
    apiUrl(`/api/v1/gift-tokens/${encodeURIComponent(token)}`),
  );
  if (!response.ok) {
    throw new GenerateApiError(await parseJsonError(response), response.status);
  }
  return (await response.json()) as GiftTokenStatusResponse;
}
