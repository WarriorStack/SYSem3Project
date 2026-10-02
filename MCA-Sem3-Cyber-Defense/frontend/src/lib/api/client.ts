import axios, { AxiosError, type AxiosInstance } from "axios";
import type { ApiErrorShape, Paginated } from "./types";

export const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:8000/api";

export const WS_BASE_URL =
  (import.meta.env["VITE_WS_BASE_URL"] as string | undefined) ?? "ws://localhost:8000/api";

const TOKEN_KEY = "cds.access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Registered by the auth provider so expired sessions log the user out. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/register")) {
        setToken(null);
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);

const STATUS_MESSAGES: Record<number, string> = {
  400: "The request was invalid. Please check the submitted values.",
  401: "Your session is not valid. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with the current state of the resource.",
  422: "Some fields failed validation. Please review and try again.",
  429: "Too many requests. Please slow down and try again shortly.",
  500: "The server encountered an error. Please try again later.",
  502: "The service is temporarily unreachable.",
  503: "The service is temporarily unavailable.",
};

/** Normalises axios / FastAPI errors into a single user-safe shape. */
export function parseApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as
      | { detail?: unknown; message?: string; errors?: Record<string, string> }
      | undefined;

    const fieldErrors: Record<string, string> = {};
    let message = "";

    if (data) {
      if (Array.isArray(data.detail)) {
        // FastAPI 422 validation payload
        for (const item of data.detail as Array<{ loc?: unknown[]; msg?: string }>) {
          const field = Array.isArray(item.loc)
            ? String(item.loc[item.loc.length - 1] ?? "")
            : "";
          if (field && item.msg) fieldErrors[field] = item.msg;
        }
        message = "Please correct the highlighted fields.";
      } else if (typeof data.detail === "string") {
        message = data.detail;
      } else if (typeof data.message === "string") {
        message = data.message;
      }
      if (data.errors && typeof data.errors === "object") {
        Object.assign(fieldErrors, data.errors);
      }
    }

    if (!message) {
      if (!error.response) {
        message =
          "Cannot reach the security API. Confirm the backend is running at " +
          API_BASE_URL +
          ".";
      } else {
        message = STATUS_MESSAGES[status] ?? "Unexpected error from the security API.";
      }
    }

    return {
      status,
      message,
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
    };
  }

  return { status: 0, message: "Unexpected application error." };
}

/**
 * Accepts either a bare array or a paginated envelope from the backend and
 * always returns a consistent paginated shape for the UI.
 */
export function normalizeList<T>(data: unknown, page = 1, pageSize = 25): Paginated<T> {
  if (Array.isArray(data)) {
    return { items: data as T[], total: data.length, page, page_size: pageSize };
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const items = (obj["items"] ?? obj["results"] ?? obj["data"] ?? []) as T[];
    return {
      items: Array.isArray(items) ? items : [],
      total: Number(obj["total"] ?? obj["count"] ?? (Array.isArray(items) ? items.length : 0)),
      page: Number(obj["page"] ?? page),
      page_size: Number(obj["page_size"] ?? obj["limit"] ?? pageSize),
      total_pages: obj["total_pages"] ? Number(obj["total_pages"]) : undefined,
    };
  }
  return { items: [], total: 0, page, page_size: pageSize };
}
