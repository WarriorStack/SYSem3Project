import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { SearchFilter } from "@/components/common/SearchFilter";
import { Pagination } from "@/components/common/Pagination";
import { SeverityBadge, StatusBadge } from "@/components/common/SeverityBadge";
import { RiskIndicator } from "@/components/common/RiskIndicator";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { alertService } from "@/lib/api/services";
import { PAGE_SIZE, SEVERITY_OPTIONS, toErrorState } from "@/lib/api/query";
import { formatDateTime, normalizeSeverity, titleCase } from "@/lib/format";
import type { Alert } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — SentinelML" },
      { name: "description", content: "Triage, investigate and resolve machine-learning security alerts." },
      { property: "og:title", content: "Alerts — SentinelML" },
      {
        property: "og:description",
        content: "Triage, investigate and resolve machine-learning security alerts.",
      },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("-timestamp");
  const [selected, setSelected] = useState<Alert | null>(null);
  const [note, setNote] = useState("");

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, search, severity, status, sort }),
    [page, search, severity, status, sort],
  );

  const query = useQuery({
    queryKey: ["alerts", params],
    queryFn: () => alertService.list(params),
    placeholderData: keepPreviousData,
  });

  const resolveMutation = useMutation({
    mutationFn: (payload: { id: string | number; resolution_note?: string | undefined }) =>
      alertService.resolve(payload.id, payload.resolution_note ? { resolution_note: payload.resolution_note } : {}),
    onSuccess: () => {
      toast.success("Alert resolved");
      setSelected(null);
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(toErrorState(error)?.message ?? "Could not resolve the alert"),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (payload: { id: string | number; status: string }) =>
      alertService.update(payload.id, { status: payload.status }),
    onSuccess: () => {
      toast.success("Alert updated");
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => toast.error(toErrorState(error)?.message ?? "Could not update the alert"),
  });

  const items = query.data?.items ?? [];
  const error = toErrorState(query.error);

  const statusOptions = useMemo(() => {
    const set = new Set(items.map((a) => a.status).filter(Boolean) as string[]);
    return [{ label: "All statuses", value: "all" }, ...[...set].map((v) => ({ label: titleCase(v), value: v }))];
  }, [items]);

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Alerts raised by the detection engine, ordered by recency and severity."
      />

      <Panel>
        <SearchFilter
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search alerts by attack type, source or title…"
          filters={[
            {
              key: "severity",
              label: "Severity",
              value: severity,
              options: SEVERITY_OPTIONS,
              onChange: (v) => {
                setSeverity(v);
                setPage(1);
              },
            },
            {
              key: "status",
              label: "Status",
              value: status,
              options: statusOptions,
              onChange: (v) => {
                setStatus(v);
                setPage(1);
              },
            },
            {
              key: "sort",
              label: "Sort",
              value: sort,
              options: [
                { label: "Newest first", value: "-timestamp" },
                { label: "Oldest first", value: "timestamp" },
                { label: "Highest risk", value: "-risk_score" },
                { label: "Severity", value: "-severity" },
              ],
              onChange: setSort,
            },
          ]}
          onReset={() => {
            setSearch("");
            setSeverity("all");
            setStatus("all");
            setSort("-timestamp");
            setPage(1);
          }}
        />

        {query.isLoading ? (
          <TableSkeleton cols={8} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="size-5" />}
            title="No alerts found"
            message="Nothing matches the current filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Attack type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Detection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((alert) => {
                  const critical = normalizeSeverity(alert.severity) === "critical";
                  return (
                    <TableRow
                      key={String(alert.id)}
                      className={cn("cursor-pointer", critical && "bg-critical/5 border-l-critical border-l-2")}
                      onClick={() => setSelected(alert)}
                    >
                      <TableCell className="font-mono text-xs">#{String(alert.id)}</TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {formatDateTime(alert.timestamp)}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={alert.severity} />
                      </TableCell>
                      <TableCell className="text-sm">{titleCase(alert.attack_type)}</TableCell>
                      <TableCell>
                        <RiskIndicator score={alert.risk_score} compact />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{alert.source_ip ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {alert.detection_id ? (
                          <Link
                            to="/detections/$id"
                            params={{ id: String(alert.detection_id) }}
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            #{String(alert.detection_id)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={alert.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveMutation.mutate({ id: alert.id });
                          }}
                          disabled={resolveMutation.isPending}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!query.isLoading && !error && items.length > 0 && (
          <Pagination
            page={query.data?.page ?? page}
            pageSize={query.data?.page_size ?? PAGE_SIZE}
            total={query.data?.total ?? items.length}
            onPageChange={setPage}
          />
        )}
      </Panel>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Alert #{String(selected.id)}
                  <SeverityBadge severity={selected.severity} />
                </SheetTitle>
                <SheetDescription>{formatDateTime(selected.timestamp)}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">attack_type</p>
                    <p>{titleCase(selected.attack_type)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">status</p>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">source_ip</p>
                    <p className="font-mono">{selected.source_ip ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">assigned_to</p>
                    <p>{selected.assigned_to ?? "Unassigned"}</p>
                  </div>
                </div>

                <RiskIndicator score={selected.risk_score} />

                {selected.description && (
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">description</p>
                    <p className="mt-1 text-sm">{selected.description}</p>
                  </div>
                )}

                {selected.detection_id && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/detections/$id" params={{ id: String(selected.detection_id) }}>
                      View related detection
                    </Link>
                  </Button>
                )}

                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="resolution">Resolution note</Label>
                  <Textarea
                    id="resolution"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe the containment or triage outcome…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        resolveMutation.mutate({ id: selected.id, resolution_note: note || undefined })
                      }
                      disabled={resolveMutation.isPending}
                    >
                      {resolveMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <CheckCircle2 className="size-4" aria-hidden />
                      )}
                      Resolve alert
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        acknowledgeMutation.mutate({ id: selected.id, status: "acknowledged" })
                      }
                      disabled={acknowledgeMutation.isPending}
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
