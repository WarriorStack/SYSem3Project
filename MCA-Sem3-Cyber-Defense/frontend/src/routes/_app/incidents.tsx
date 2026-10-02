import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Folder, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { SearchFilter } from "@/components/common/SearchFilter";
import { Pagination } from "@/components/common/Pagination";
import { SeverityBadge, StatusBadge } from "@/components/common/SeverityBadge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { incidentService } from "@/lib/api/services";
import { PAGE_SIZE, SEVERITY_OPTIONS, toErrorState } from "@/lib/api/query";
import { formatDateTime, titleCase } from "@/lib/format";
import type { Incident } from "@/lib/api/types";

export const Route = createFileRoute("/_app/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents — SentinelML" },
      { name: "description", content: "Create, track and update security incidents raised from alerts." },
      { property: "og:title", content: "Incidents — SentinelML" },
      {
        property: "og:description",
        content: "Create, track and update security incidents raised from alerts.",
      },
    ],
  }),
  component: IncidentsPage,
});

function IncidentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSeverity, setNewSeverity] = useState("medium");
  const [formError, setFormError] = useState<string | null>(null);

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, search, severity, status }),
    [page, search, severity, status],
  );

  const query = useQuery({
    queryKey: ["incidents", params],
    queryFn: () => incidentService.list(params),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Incident>) => incidentService.create(payload),
    onSuccess: () => {
      toast.success("Incident created");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      void queryClient.invalidateQueries({ queryKey: ["incidents"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => setFormError(toErrorState(error)?.message ?? "Could not create the incident"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string | number; data: Partial<Incident> }) =>
      incidentService.update(payload.id, payload.data),
    onSuccess: (incident) => {
      toast.success("Incident updated");
      setSelected(incident);
      void queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (error) => toast.error(toErrorState(error)?.message ?? "Could not update the incident"),
  });

  const items = query.data?.items ?? [];
  const error = toErrorState(query.error);

  const statusOptions = useMemo(() => {
    const set = new Set(items.map((i) => i.status).filter(Boolean) as string[]);
    return [{ label: "All statuses", value: "all" }, ...[...set].map((v) => ({ label: titleCase(v), value: v }))];
  }, [items]);

  return (
    <>
      <PageHeader
        title="Incidents"
        description="Coordinated response records grouping related alerts and detections."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden /> New incident
          </Button>
        }
      />

      <Panel>
        <SearchFilter
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search incidents…"
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
          ]}
          onReset={() => {
            setSearch("");
            setSeverity("all");
            setStatus("all");
            setPage(1);
          }}
        />

        {query.isLoading ? (
          <TableSkeleton cols={6} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Folder className="size-5" />}
            title="No incidents recorded"
            message="Create an incident to coordinate response across related alerts."
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Create incident
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Related alerts</TableHead>
                  <TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((incident) => (
                  <TableRow
                    key={String(incident.id)}
                    className="cursor-pointer"
                    onClick={() => setSelected(incident)}
                  >
                    <TableCell>
                      <p className="text-sm font-medium">{incident.title}</p>
                      <p className="text-muted-foreground font-mono text-xs">#{String(incident.id)}</p>
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={incident.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={incident.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {formatDateTime(incident.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {incident.alert_ids?.length ?? incident.alerts?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-sm">{incident.assigned_to ?? "Unassigned"}</TableCell>
                  </TableRow>
                ))}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New incident</DialogTitle>
            <DialogDescription>
              Creates an incident record through the incident management API.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFormError(null);
              if (!title.trim()) {
                setFormError("A title is required.");
                return;
              }
              createMutation.mutate({
                title: title.trim(),
                description: description.trim(),
                severity: newSeverity,
              });
            }}
            className="space-y-4"
          >
            {formError && <p className="text-destructive text-sm">{formError}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="incident-title">Title</Label>
              <Input id="incident-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="incident-severity">Severity</Label>
              <Select value={newSeverity} onValueChange={setNewSeverity}>
                <SelectTrigger id="incident-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="incident-description">Description</Label>
              <Textarea
                id="incident-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Create incident
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>
                  #{String(selected.id)} · created {formatDateTime(selected.created_at)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={selected.severity} />
                  <StatusBadge status={selected.status} />
                </div>
                <p className="text-sm">{selected.description || "No description provided."}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">assigned_to</p>
                    <p>{selected.assigned_to ?? "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">updated_at</p>
                    <p className="font-mono text-xs">{formatDateTime(selected.updated_at)}</p>
                  </div>
                </div>

                {(selected.alerts ?? []).length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-[11px] tracking-wider uppercase">
                      Related alerts
                    </p>
                    <ul className="divide-y rounded-md border">
                      {(selected.alerts ?? []).map((alert) => (
                        <li key={String(alert.id)} className="flex items-center justify-between px-3 py-2">
                          <span className="font-mono text-xs">#{String(alert.id)}</span>
                          <SeverityBadge severity={alert.severity} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="incident-status">Update status</Label>
                  <Select
                    value={selected.status ?? ""}
                    onValueChange={(value) =>
                      updateMutation.mutate({ id: selected.id, data: { status: value } })
                    }
                  >
                    <SelectTrigger id="incident-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(statusOptions.filter((o) => o.value !== "all").length
                        ? statusOptions.filter((o) => o.value !== "all")
                        : [
                            { label: "Open", value: "open" },
                            { label: "Investigating", value: "investigating" },
                            { label: "Contained", value: "contained" },
                            { label: "Closed", value: "closed" },
                          ]
                      ).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Only statuses returned by the backend are offered.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
