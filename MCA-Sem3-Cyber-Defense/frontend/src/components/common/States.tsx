import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading security data…",
  className,
}: {
  label?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "text-muted-foreground flex flex-col items-center justify-center gap-3 py-14 text-sm",
        className,
      )}
    >
      <Loader2 className="text-primary size-6 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4" role="status" aria-live="polite" aria-label="Loading table data">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load data",
  message,
  onRetry,
  className,
}: {
  title?: string | undefined;
  message?: string | undefined;
  onRetry?: () => void | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}
    >
      <div className="bg-destructive/15 text-destructive flex size-11 items-center justify-center rounded-full">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <div>
        <p className="text-foreground text-sm font-semibold">{title}</p>
        {message && <p className="text-muted-foreground mt-1 max-w-md text-sm">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No records found",
  message,
  icon,
  action,
  className,
}: {
  title?: string | undefined;
  message?: string | undefined;
  icon?: ReactNode | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}
    >
      <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </div>
      <div>
        <p className="text-foreground text-sm font-semibold">{title}</p>
        {message && <p className="text-muted-foreground mt-1 max-w-md text-sm">{message}</p>}
      </div>
      {action}
    </div>
  );
}

/** Uniform async wrapper used by every API-driven panel. */
export function AsyncBoundary({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loadingNode,
  emptyTitle,
  emptyMessage,
  children,
}: {
  isLoading: boolean;
  error?: { message: string } | null | undefined;
  isEmpty?: boolean | undefined;
  onRetry?: () => void | undefined;
  loadingNode?: ReactNode | undefined;
  emptyTitle?: string | undefined;
  emptyMessage?: string | undefined;
  children: ReactNode;
}) {
  if (isLoading) return <>{loadingNode ?? <LoadingState />}</>;
  if (error) return <ErrorState message={error.message} {...(onRetry ? { onRetry } : {})} />;
  if (isEmpty)
    return (
      <EmptyState
        {...(emptyTitle ? { title: emptyTitle } : {})}
        {...(emptyMessage ? { message: emptyMessage } : {})}
      />
    );
  return <>{children}</>;
}
