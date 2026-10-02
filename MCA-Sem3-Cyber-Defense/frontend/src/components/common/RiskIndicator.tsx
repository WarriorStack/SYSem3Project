import { cn } from "@/lib/utils";
import { riskBand, riskValue, toPercent } from "@/lib/format";
import type { Severity } from "@/lib/api/types";

const BAR: Record<Severity, string> = {
  critical: "bg-critical",
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
  info: "bg-info",
};

const TEXT: Record<Severity, string> = {
  critical: "text-critical",
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
  info: "text-info",
};

export function RiskIndicator({
  score,
  className,
  compact = false,
  label = "Risk score",
}: {
  score?: number | null | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
  label?: string | undefined;
}) {
  const value = riskValue(score);
  const band = riskBand(score);

  if (value === null) return <span className="text-muted-foreground text-sm">—</span>;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
          <div className={cn("h-full rounded-full", BAR[band])} style={{ width: `${value}%` }} />
        </div>
        <span className={cn("font-mono text-xs font-semibold tabular-nums", TEXT[band])}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-xs tracking-wide uppercase">{label}</span>
        <span className={cn("font-mono text-lg font-bold tabular-nums", TEXT[band])}>{value}</span>
      </div>
      <div
        className="bg-muted h-2 overflow-hidden rounded-full"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full transition-all", BAR[band])}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ConfidenceMeter({
  confidence,
  className,
  compact = false,
}: {
  confidence?: number | null | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
}) {
  const pct = toPercent(confidence);
  if (pct === null) return <span className="text-muted-foreground text-sm">—</span>;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums">{pct}%</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-xs tracking-wide uppercase">
          Model confidence
        </span>
        <span className="text-primary font-mono text-lg font-bold tabular-nums">{pct}%</span>
      </div>
      <div
        className="bg-muted h-2 overflow-hidden rounded-full"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Model confidence"
      >
        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
