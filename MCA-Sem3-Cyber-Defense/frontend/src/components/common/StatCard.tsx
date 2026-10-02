import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Tone = "default" | "critical" | "high" | "medium" | "low" | "success" | "info";

const TONES: Record<Tone, { ring: string; icon: string; value: string }> = {
  default: { ring: "border-border", icon: "bg-secondary text-foreground", value: "text-foreground" },
  critical: { ring: "border-critical/40", icon: "bg-critical/15 text-critical", value: "text-critical" },
  high: { ring: "border-high/40", icon: "bg-high/15 text-high", value: "text-high" },
  medium: { ring: "border-medium/40", icon: "bg-medium/15 text-medium", value: "text-medium" },
  low: { ring: "border-low/40", icon: "bg-low/15 text-low", value: "text-low" },
  success: { ring: "border-success/40", icon: "bg-success/15 text-success", value: "text-success" },
  info: { ring: "border-info/40", icon: "bg-info/15 text-info", value: "text-info" },
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  isLoading,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string | undefined;
  icon?: LucideIcon | undefined;
  tone?: Tone | undefined;
  isLoading?: boolean | undefined;
  className?: string | undefined;
}) {
  const t = TONES[tone];
  return (
    <div className={cn("bg-card rounded-lg border p-4", t.ring, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className={cn("mt-1 font-mono text-2xl font-bold tabular-nums", t.value)}>{value}</p>
          )}
          {hint && <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", t.icon)}>
            <Icon className="size-4.5" aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
