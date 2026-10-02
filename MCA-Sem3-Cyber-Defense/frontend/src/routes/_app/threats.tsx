import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bug, Crosshair } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { SearchFilter } from "@/components/common/SearchFilter";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { threatService } from "@/lib/api/services";
import { SEVERITY_OPTIONS, toErrorState } from "@/lib/api/query";
import { formatNumber, formatRelative, titleCase } from "@/lib/format";
import type { Threat } from "@/lib/api/types";

export const Route = createFileRoute("/_app/threats")({
  head: () => ({
    meta: [
      { title: "Threat Intelligence — SentinelML" },
      { name: "description", content: "Detected threat categories, indicators and response guidance." },
      { property: "og:title", content: "Threat Intelligence — SentinelML" },
      {
        property: "og:description",
        content: "Detected threat categories, indicators and response guidance.",
      },
    ],
  }),
  component: ThreatsPage,
});

function ThreatCard({ threat, onSelect }: { threat: Threat; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="bg-card hover:border-primary/50 rounded-lg border p-4 text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {threat.name ?? titleCase(threat.attack_type)}
          </p>
          <p className="text-muted-foreground text-xs">{titleCase(threat.category)}</p>
        </div>
        <SeverityBadge severity={threat.severity} />
      </div>
      <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">
        {threat.description ?? "No description provided by the threat feed."}
      </p>
      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-xs">
        <span>
          Detections:{" "}
          <span className="text-foreground font-mono">{formatNumber(threat.detection_count ?? 0)}</span>
        </span>
        <span>Last seen: {formatRelative(threat.last_seen)}</span>
        {threat.technique_id && (
          <span className="text-primary font-mono">{threat.technique_id}</span>
        )}
      </div>
    </button>
  );
}

function ThreatsPage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [selected, setSelected] = useState<Threat | null>(null);

  const query = useQuery({
    queryKey: ["threats", { search, severity }],
    queryFn: () => threatService.list({ search, severity }),
  });

  const items = query.data?.items ?? [];
  const error = toErrorState(query.error);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((t) =>
      [t.name, t.attack_type, t.category, t.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [items, search]);

  return (
    <>
      <PageHeader
        title="Threat Intelligence"
        description="Attack categories observed by the platform with associated indicators."
      />

      <Panel>
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search threat categories…"
          filters={[
            {
              key: "severity",
              label: "Severity",
              value: severity,
              options: SEVERITY_OPTIONS,
              onChange: setSeverity,
            },
          ]}
          onReset={() => {
            setSearch("");
            setSeverity("all");
          }}
        />

        {query.isLoading ? (
          <LoadingState label="Loading threat catalogue…" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bug className="size-5" />}
            title="No threats catalogued"
            message="Threat categories appear once the backend classifies traffic."
          />
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((threat) => (
              <ThreatCard key={String(threat.id)} threat={threat} onSelect={() => setSelected(threat)} />
            ))}
          </div>
        )}
      </Panel>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name ?? titleCase(selected.attack_type)}</SheetTitle>
                <SheetDescription>{titleCase(selected.category)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6">
                <SeverityBadge severity={selected.severity} />
                <p className="text-sm">{selected.description ?? "No description available."}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      detection_count
                    </p>
                    <p className="font-mono">{formatNumber(selected.detection_count ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">first_seen</p>
                    <p className="font-mono text-xs">{formatRelative(selected.first_seen)}</p>
                  </div>
                </div>

                {(selected.indicators ?? []).length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-[11px] tracking-wider uppercase">
                      Indicators
                    </p>
                    <ul className="space-y-1">
                      {(selected.indicators ?? []).map((indicator) => (
                        <li key={indicator} className="bg-secondary/50 rounded px-2 py-1 font-mono text-xs">
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.recommended_action && (
                  <div className="border-primary/40 bg-primary/5 rounded-md border p-3">
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      Recommended action
                    </p>
                    <p className="mt-1 text-sm">{selected.recommended_action}</p>
                  </div>
                )}

                {selected.technique_id && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/mitre/$techniqueId" params={{ techniqueId: selected.technique_id }}>
                      <Crosshair className="size-4" aria-hidden /> View ATT&CK technique
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
