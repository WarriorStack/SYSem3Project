import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket, type SocketMessage, type SocketStatus } from "./use-socket";
import { normalizeSeverity, titleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";

interface RealtimeState {
  dashboardStatus: SocketStatus;
  alertStatus: SocketStatus;
  liveEvents: SocketMessage[];
  reconnectAll: () => void;
}

const RealtimeContext = createContext<RealtimeState | null>(null);

function describe(message: SocketMessage): { title: string; severity: string } {
  const payload = (message.data ?? message.payload ?? message) as Record<string, unknown>;
  const attack = (payload["attack_type"] ?? payload["prediction"] ?? "Security event") as string;
  const severity = normalizeSeverity(payload["severity"] as string | undefined);
  return { title: titleCase(String(attack)), severity };
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [liveEvents, setLiveEvents] = useState<SocketMessage[]>([]);

  const handle = useCallback(
    (channel: "dashboard" | "alerts") => (message: SocketMessage) => {
      setLiveEvents((prev) => [{ ...message, __channel: channel }, ...prev].slice(0, 50));

      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (channel === "alerts") {
        void queryClient.invalidateQueries({ queryKey: ["alerts"] });
        void queryClient.invalidateQueries({ queryKey: ["detections"] });

        const { title, severity } = describe(message);
        const body = `${titleCase(severity)} severity · ${new Date().toLocaleTimeString()}`;
        if (severity === "critical" || severity === "high") {
          toast.error(title, { description: body });
        } else {
          toast(title, { description: body });
        }
      }
    },
    [queryClient],
  );

  const dashboard = useSocket({
    path: "/ws/dashboard",
    enabled: isAuthenticated,
    onMessage: handle("dashboard"),
  });
  const alerts = useSocket({
    path: "/ws/alerts",
    enabled: isAuthenticated,
    onMessage: handle("alerts"),
  });

  const value = useMemo<RealtimeState>(
    () => ({
      dashboardStatus: dashboard.status,
      alertStatus: alerts.status,
      liveEvents,
      reconnectAll: () => {
        dashboard.reconnect();
        alerts.reconnect();
      },
    }),
    [dashboard, alerts, liveEvents],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeState {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    return {
      dashboardStatus: "closed",
      alertStatus: "closed",
      liveEvents: [],
      reconnectAll: () => {},
    };
  }
  return ctx;
}
