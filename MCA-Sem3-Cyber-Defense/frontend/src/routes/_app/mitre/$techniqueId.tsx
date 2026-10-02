import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { mitreService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { formatDateTime, formatNumber, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_app/mitre/$techniqueId")({
  head: () => ({
    meta: [
      { title: "ATT&CK technique — SentinelML" },
      { name: "description", content: "Details of a MITRE ATT&CK technique observed in this environment." },
      { property: "og:title", content: "ATT&CK technique — SentinelML" },
      {
        property: "og:description",
        content: "Details of a MITRE ATT&CK technique observed in this environment.",
      },
    ],
  }),
  component: TechniquePage,
});

function TechniquePage() {
  const { techniqueId } = Route.useParams();
  const query = useQuery({
    queryKey: ["mitre", "technique", techniqueId],
    queryFn: () => mitreService.technique(techniqueId),
  });

  const technique = query.data;
  const error = toErrorState(query.error);

  return (
    <>
      <PageHeader
        title={techniqueId}
        description={technique?.name ?? "MITRE ATT&CK technique detail"}
        actions={
          <div className="flex gap-2">
            {technique?.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={technique.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" aria-hidden /> MITRE reference
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/mitre">
                <ArrowLeft className="size-4" aria-hidden /> All techniques
              </Link>
            </Button>
          </div>
        }
      />

      {query.isLoading ? (
        <Panel>
          <LoadingState label="Loading technique…" />
        </Panel>
      ) : error ? (
        <Panel>
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        </Panel>
      ) : !technique ? (
        <Panel>
          <EmptyState title="Technique not found" />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Description" className="lg:col-span-2" bodyClassName="p-4">
              <p className="text-sm leading-relaxed">
                {technique.description ?? "No description supplied for this technique."}
              </p>
            </Panel>
            <Panel title="Context" bodyClassName="grid grid-cols-2 gap-4 p-4">
              <div>
                <p className="text-muted-foreground text-[11px] tracking-wider uppercase">technique_id</p>
                <p className="text-primary font-mono text-sm">{technique.technique_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] tracking-wider uppercase">tactic</p>
                <p className="text-sm">{titleCase(technique.tactic)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                  attack_category
                </p>
                <p className="text-sm">{titleCase(technique.attack_category)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] tracking-wider uppercase">detections</p>
                <p className="font-mono text-sm">{formatNumber(technique.detection_count ?? 0)}</p>
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Associated detections" bodyClassName="divide-y">
              {(technique.detections ?? []).length === 0 ? (
                <EmptyState
                  title="No linked detections"
                  message="No detections have been mapped to this technique yet."
                />
              ) : (
                (technique.detections ?? []).map((detection) => (
                  <Link
                    key={String(detection.id)}
                    to="/detections/$id"
                    params={{ id: String(detection.id) }}
                    className="hover:bg-accent/40 flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{titleCase(detection.attack_type)}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {formatDateTime(detection.timestamp)}
                      </p>
                    </div>
                    <SeverityBadge severity={detection.severity} />
                  </Link>
                ))
              )}
            </Panel>

            <Panel title="Associated incidents" bodyClassName="divide-y">
              {(technique.incidents ?? []).length === 0 ? (
                <EmptyState
                  title="No linked incidents"
                  message="No incidents reference this technique."
                />
              ) : (
                (technique.incidents ?? []).map((incident) => (
                  <div key={String(incident.id)} className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="truncate text-sm">{incident.title}</p>
                    <SeverityBadge severity={incident.severity} />
                  </div>
                ))
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
