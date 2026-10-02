import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode | undefined;
}) {
  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight">SentinelML</p>
            <p className="text-muted-foreground text-[11px] tracking-widest uppercase">
              AI Cyber Defense Platform
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 shadow-lg">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="text-muted-foreground mt-4 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
