import { cn } from "@/lib/utils";
import { normalizeSeverity, titleCase } from "@/lib/format";
import type { Severity } from "@/lib/api/types";

const STYLES: Record<Severity, string> = {
  critical: "bg-critical/15 text-critical border-critical/40",
  high: "bg-high/15 text-high border-high/40",
  medium: "bg-medium/15 text-medium border-medium/40",
  low: "bg-low/15 text-low border-low/40",
  info: "bg-muted text-muted-foreground border-border",
};

export function SeverityBadge({
  severity,
  className,
  showDot = true,
}: {
  severity?: string | null | undefined;
  className?: string | undefined;
  showDot?: boolean | undefined;
}) {
  const level = normalizeSeverity(severity);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
        STYLES[level],
        className,
      )}
    >
      {showDot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {severity ? titleCase(severity) : "Unknown"}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-critical/15 text-critical border-critical/40",
  new: "bg-info/15 text-info border-info/40",
  active: "bg-high/15 text-high border-high/40",
  investigating: "bg-medium/15 text-medium border-medium/40",
  in_progress: "bg-medium/15 text-medium border-medium/40",
  acknowledged: "bg-low/15 text-low border-low/40",
  contained: "bg-low/15 text-low border-low/40",
  resolved: "bg-success/15 text-success border-success/40",
  closed: "bg-success/15 text-success border-success/40",
  mitigated: "bg-success/15 text-success border-success/40",
  false_positive: "bg-muted text-muted-foreground border-border",
  dismissed: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status?: string | null | undefined; className?: string | undefined }) {
  const key = (status ?? "").toString().toLowerCase().replace(/\s+/g, "_");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[key] ?? "bg-secondary text-secondary-foreground border-border",
        className,
      )}
    >
      {status ? titleCase(status) : "Unknown"}
    </span>
  );
}
