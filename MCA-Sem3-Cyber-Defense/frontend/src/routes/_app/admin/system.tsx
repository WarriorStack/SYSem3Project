import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Server, Signal } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState, TableSkeleton } from "@/components/common/States";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { API_BASE_URL, WS_BASE_URL } from "@/lib/api/client";
import { formatDateTime, titleCase } from "@/lib/format";
import { useRealtime } from "@/lib/realtime/realtime-context";

export const Route = createFileRoute("/_app/admin/system")({
  head: () => ({
    meta: [
      { title: "System Health — SentinelML Admin" },
      { name: "description", content: "Platform service health, connectivity and audit activity." },
      { property: "og:title", content: "System Health — SentinelML Admin" },
      { property: "og:description", content: "Platform service health, connectivity and audit activity." },
    ],
  }),
  component: () => (
    <RoleGuard roles={["admin"]}>
      <AdminSystemPage />
    </RoleGuard>
  ),
});

function AdminSystemPage() {
  const { dashboardStatus, alertStatus } = useRealtime();

  const statusQuery = useQuery({
    queryKey: ["admin", "system"],
    queryFn: adminService.systemStatus,
  });
  const auditQuery = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => adminService.auditLogs({ page_size: 25 }),
    retry: false,
  });

  const status = statusQuery.data ?? {};
  const statusError = toErrorState(statusQuery.error);
  const auditError = toErrorState(auditQuery.error);
  const logs = auditQuery.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="System Health"
        description="Connectivity and service state reported by the backend platform."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Connectivity" bodyClassName="space-y-3 p-4" className="lg:col-span-1">
          <div>
            <p className="text-muted-foreground text-[11px] tracking-wider uppercase">API base URL</p>
            <p className="font-mono text-xs break-all">{API_BASE_URL}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[11px] tracking-wider uppercase">WebSocket base</p>
            <p className="font-mono text-xs break-all">{WS_BASE_URL}</p>
          </div>
          <div className="flex items-center gap-2 border-t pt-3 text-sm">
            <Signal className="text-muted-foreground size-4" aria-hidden />
            /ws/dashboard: <span className="font-mono">{dashboardStatus}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Signal className="text-muted-foreground size-4" aria-hidden />
            /ws/alerts: <span className="font-mono">{alertStatus}</span>
          </div>
        </Panel>

        <Panel title="Service status" className="lg:col-span-2" bodyClassName="p-4">
          {statusQuery.isLoading ? (
            <LoadingState label="Querying platform status…" />
          ) : statusError ? (
            <ErrorState message={statusError.message} onRetry={() => void statusQuery.refetch()} />
          ) : Object.keys(status).length === 0 ? (
            <EmptyState
              icon={<Server className="size-5" />}
              title="No system status reported"
              message="The backend summary does not include a system_status object."
            />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-3">
              {Object.entries(status)
                .filter(([, v]) => typeof v === "string" || typeof v === "number")
                .map(([key, value]) => (
                  <div key={key} className="bg-secondary/40 rounded-md border p-3">
                    <dt className="text-muted-foreground text-xs">{titleCase(key)}</dt>
                    <dd className="mt-0.5 font-mono text-sm">{String(value)}</dd>
                  </div>
                ))}
            </dl>
          )}
        </Panel>
      </div>

      <Panel title="Audit activity" description="Recent administrative and authentication events">
        {auditQuery.isLoading ? (
          <TableSkeleton cols={5} />
        ) : auditError ? (
          <EmptyState
            icon={<Server className="size-5" />}
            title="Audit log unavailable"
            message="The backend has not exposed an audit log endpoint for this deployment."
          />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit records" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={String(log.id)}>
                    <TableCell className="font-mono text-xs">{formatDateTime(log.timestamp)}</TableCell>
                    <TableCell className="text-sm">{log.user_email ?? String(log.user_id ?? "—")}</TableCell>
                    <TableCell className="text-sm">{titleCase(log.action)}</TableCell>
                    <TableCell className="text-sm">{log.resource ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip_address ?? "—"}</TableCell>
                    <TableCell className="text-sm">{titleCase(log.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </>
  );
}
