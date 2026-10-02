import type { Severity } from "@/lib/api/types";

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function formatRelative(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return "just now";
  if (Math.abs(mins) < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Confidence may arrive as 0–1 or 0–100; normalise to a percentage. */
export function toPercent(value?: number | null): number | null {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  return value <= 1 ? Math.round(value * 1000) / 10 : Math.round(value * 10) / 10;
}

export function formatPercent(value?: number | null): string {
  const pct = toPercent(value);
  return pct === null ? "—" : `${pct}%`;
}

export function formatNumber(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat().format(value);
}

export function normalizeSeverity(value?: string | null): Severity {
  const key = (value ?? "").toString().toLowerCase();
  if (key.includes("crit")) return "critical";
  if (key.includes("high")) return "high";
  if (key.includes("med")) return "medium";
  if (key.includes("low")) return "low";
  return "info";
}

export function riskBand(score?: number | null): Severity {
  if (score === undefined || score === null) return "info";
  const value = score <= 1 ? score * 100 : score;
  if (value >= 80) return "critical";
  if (value >= 60) return "high";
  if (value >= 40) return "medium";
  return "low";
}

export function riskValue(score?: number | null): number | null {
  if (score === undefined || score === null || Number.isNaN(score)) return null;
  return Math.round((score <= 1 ? score * 100 : score) * 10) / 10;
}

export function titleCase(value?: string | null): string {
  if (!value) return "—";
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
