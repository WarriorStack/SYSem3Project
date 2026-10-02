import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bug,
  Crosshair,
  FileText,
  Folder,
  Cpu,
  LayoutDashboard,
  Server,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";

interface NavItem {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean | undefined;
}

const SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Monitoring",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/detections", label: "Detections", icon: Activity },
      { to: "/alerts", label: "Alerts", icon: AlertTriangle },
      { to: "/incidents", label: "Incidents", icon: Folder },
    ],
  },
  {
    title: "Threat intelligence",
    items: [
      { to: "/threats", label: "Threats", icon: Bug },
      { to: "/mitre", label: "MITRE ATT&CK", icon: Crosshair },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/reports", label: "Reports", icon: FileText },
      { to: "/models", label: "ML Models", icon: Cpu },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/admin/users", label: "User Management", icon: Users, adminOnly: true },
      { to: "/admin/system", label: "System Health", icon: Server, adminOnly: true },
    ],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "bg-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-md">
              <ShieldCheck className="size-4.5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">SentinelML</span>
              <span className="text-muted-foreground block text-[10px] tracking-widest uppercase">
                Cyber Defense
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => {
            const items = section.items.filter((item) => !item.adminOnly || isAdmin);
            if (!items.length) return null;
            return (
              <div key={section.title}>
                <p className="text-muted-foreground px-2 pb-2 text-[10px] font-semibold tracking-widest uppercase">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active =
                      pathname === item.to || pathname.startsWith(`${String(item.to)}/`);
                    return (
                      <li key={String(item.to)}>
                        <Link
                          to={item.to}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon
                            className={cn("size-4", active ? "text-primary" : "text-muted-foreground")}
                            aria-hidden
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
