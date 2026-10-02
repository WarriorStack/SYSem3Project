import { parseApiError } from "./client";

/** Converts an unknown react-query error into a user-safe message object. */
export function toErrorState(error: unknown): { message: string; status: number } | null {
  if (!error) return null;
  const parsed = parseApiError(error);
  return { message: parsed.message, status: parsed.status };
}

export const SEVERITY_OPTIONS = [
  { label: "All severities", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const PAGE_SIZE = 25;
