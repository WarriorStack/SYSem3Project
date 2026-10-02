import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, RefreshCw, User as UserIcon, Wifi, WifiOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { useRealtime } from "@/lib/realtime/realtime-context";
import { cn } from "@/lib/utils";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dashboardStatus, alertStatus, reconnectAll } = useRealtime();

  const live = dashboardStatus === "open" || alertStatus === "open";
  const connecting = dashboardStatus === "connecting" || alertStatus === "connecting";

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await logout();
    navigate({ to: "/login", replace: true });
  };

  const initials = (user?.name ?? user?.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
      <button
        type="button"
        onClick={onMenuClick}
        className="text-muted-foreground hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={reconnectAll}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
          live
            ? "border-success/40 bg-success/10 text-success"
            : connecting
              ? "border-medium/40 bg-medium/10 text-medium"
              : "border-destructive/40 bg-destructive/10 text-destructive",
        )}
        title="Realtime channel status — click to reconnect"
      >
        {live ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
        {live ? "Live" : connecting ? "Connecting" : "Offline"}
        {!live && !connecting && <RefreshCw className="size-3.5" aria-hidden />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <span className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-full text-xs font-semibold">
              {initials || "?"}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[140px] truncate text-sm leading-tight">
                {user?.name ?? user?.email}
              </span>
              <span className="text-muted-foreground block text-[10px] tracking-wider uppercase">
                {role ?? "user"}
              </span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <UserIcon className="size-4" aria-hidden /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void handleSignOut()}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
