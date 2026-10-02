import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crosshair } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { SearchFilter } from "@/components/common/SearchFilter";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/States";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mitreService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { formatNumber, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_app/mitre/")({
  head: () => ({
    meta: [
      { title: "MITRE ATT&CK Mapping — SentinelML" },
      {
        name: "description",
        content: "ATT&CK techniques mapped to detected attack categories and incidents.",
      },
      { property: "og:title", content: "MITRE ATT&CK Mapping — SentinelML" },
      {
        property: "og:description",
        content: "ATT&CK techniques mapped to detected attack categories and incidents.",
      },
    ],
  }),
  component: MitrePage,
});

function MitrePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tactic, setTactic] = useState("all");

  const query = useQuery({
    queryKey: ["mitre", "techniques"],
    queryFn: () => mitreService.techniques(),
  });

  const items = query.data?.items ?? [];
  const error = toErrorState(query.error);

  const tacticOptions = useMemo(() => {
    const set = new Set(items.map((t) => t.tactic).filter(Boolean) as string[]);
    return [{ label: "All tactics", value: "all" }, ...[...set].map((v) => ({ label: titleCase(v), value: v }))];
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((t) => {
      const matchesTactic = tactic === "all" || t.tactic === tactic;
      const matchesTerm =
        !term ||
        [t.technique_id, t.name, t.attack_category, t.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      return matchesTactic && matchesTerm;
    });
  }, [items, search, tactic]);

  return (
    <>
      <PageHeader
        title="MITRE ATT&CK"
        description="How detected attack categories map onto adversary techniques."
      />

      <Panel>
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search technique ID, name or category…"
          filters={[
            { key: "tactic", label: "Tactic", value: tactic, options: tacticOptions, onChange: setTactic },
          ]}
          onReset={() => {
            setSearch("");
            setTactic("all");
          }}
        />

        {query.isLoading ? (
          <TableSkeleton cols={5} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Crosshair className="size-5" />}
            title="No techniques mapped"
            message="ATT&CK mappings appear once detections are linked to techniques."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technique ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Tactic</TableHead>
                  <TableHead>Attack category</TableHead>
                  <TableHead>Detections</TableHead>
                  <TableHead>Incidents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((technique) => (
                  <TableRow
                    key={technique.technique_id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: "/mitre/$techniqueId",
                        params: { techniqueId: technique.technique_id },
                      })
                    }
                  >
                    <TableCell className="text-primary font-mono text-xs">
                      {technique.technique_id}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{technique.name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{titleCase(technique.tactic)}</TableCell>
                    <TableCell className="text-sm">{titleCase(technique.attack_category)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatNumber(technique.detection_count ?? 0)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatNumber(technique.incident_count ?? 0)}
                    </TableCell>
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
