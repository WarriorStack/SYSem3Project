import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Crosshair, FileSearch, ShieldCheck } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { SeverityBadge, StatusBadge } from "@/components/common/SeverityBadge";
import { ConfidenceMeter, RiskIndicator } from "@/components/common/RiskIndicator";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { detectionService, alertService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { formatDateTime, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_app/detections/$id")({
  head: () => ({
    meta: [
      { title: "Detection detail — SentinelML" },
      {
        name: "description",
        content: "Full context for a single machine-learning threat detection.",
      },
      { property: "og:title", content: "Detection detail — SentinelML" },
      {
        property: "og:description",
        content: "Full context for a single machine-learning threat detection.",
      },
    ],
  }),
  component: DetectionDetailPage,
});

function Field({ label, value, mono }: { label: string; value?: string | number | null | undefined; mono?: boolean | undefined }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[11px] tracking-wider uppercase">{label}</dt>
      <dd className={`mt-0.5 text-sm ${mono ? "font-mono" : ""}`}>
        {value === undefined || value === null || value === "" ? "—" : String(value)}
      </dd>
    </div>
  );
}

function DetectionDetailPage() {
  const { id } = Route.useParams();

  const query = useQuery({
    queryKey: ["detections", "detail", id],
    queryFn: () => detectionService.get(id),
  });

  const relatedAlerts = useQuery({
    queryKey: ["alerts", "by-detection", id],
    queryFn: () => alertService.list({ detection_id: id, page_size: 10 }),
    enabled: Boolean(id),
  });

  const detection = query.data;
  const error = toErrorState(query.error);
  const explanation = detection?.explanation;
  const explanationText =
    typeof explanation === "string" ? explanation : (explanation?.summary ?? null);
  const topFeatures = typeof explanation === "object" && explanation ? (explanation.top_features ?? []) : [];
  const techniqueId = detection?.mitre?.technique_id ?? detection?.technique_id;

  return (
    <>
      <PageHeader
        title={`Detection ${id}`}
        description="Classification, risk assessment, explainability and ATT&CK mapping for this event."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/detections">
              <ArrowLeft className="size-4" aria-hidden /> Back to detections
            </Link>
          </Button>
        }
      />

      {query.isLoading ? (
        <Panel>
          <LoadingState label="Loading detection…" />
        </Panel>
      ) : error ? (
        <Panel>
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        </Panel>
      ) : !detection ? (
        <Panel>
          <EmptyState title="Detection not found" message="This detection ID is not available." />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <Panel bodyClassName="p-4" className="lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                    Predicted class
                  </p>
                  <p className="text-lg font-semibold">{titleCase(detection.prediction)}</p>
                  <p className="text-muted-foreground text-xs">
                    Attack type: {titleCase(detection.attack_type)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <SeverityBadge severity={detection.severity} />
                  <StatusBadge status={detection.status} />
                </div>
              </div>
            </Panel>
            <Panel bodyClassName="p-4">
              <ConfidenceMeter confidence={detection.confidence} />
            </Panel>
            <Panel bodyClassName="p-4">
              <RiskIndicator score={detection.risk_score} />
            </Panel>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="explain">Explainability</TabsTrigger>
              <TabsTrigger value="mitre">ATT&CK</TabsTrigger>
              <TabsTrigger value="alerts">Related alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Event" bodyClassName="grid grid-cols-2 gap-4 p-4">
                  <Field label="detection id" value={String(detection.id)} mono />
                  <Field label="timestamp" value={formatDateTime(detection.timestamp)} mono />
                  <Field label="protocol" value={detection.protocol} mono />
                  <Field label="model" value={detection.model_name ?? detection.model_id} />
                </Panel>
                <Panel title="Network endpoints" bodyClassName="grid grid-cols-2 gap-4 p-4">
                  <Field label="source_ip" value={detection.source_ip} mono />
                  <Field label="source_port" value={detection.source_port} mono />
                  <Field label="destination_ip" value={detection.destination_ip} mono />
                  <Field label="destination_port" value={detection.destination_port} mono />
                </Panel>
              </div>
              {detection.recommended_action && (
                <Panel
                  title="Recommended action"
                  className="border-primary/40 mt-4"
                  bodyClassName="p-4"
                >
                  <p className="flex items-start gap-2 text-sm">
                    <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                    {detection.recommended_action}
                  </p>
                </Panel>
              )}
            </TabsContent>

            <TabsContent value="features">
              <Panel title="Extracted features">
                {detection.features && Object.keys(detection.features).length > 0 ? (
                  <dl className="grid gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
                    {Object.entries(detection.features).map(([key, value]) => (
                      <Field key={key} label={key} value={value as string | number | null} mono />
                    ))}
                  </dl>
                ) : (
                  <EmptyState
                    icon={<FileSearch className="size-5" />}
                    title="No feature vector returned"
                    message="The backend did not include extracted features for this detection."
                  />
                )}
              </Panel>
            </TabsContent>

            <TabsContent value="explain">
              <Panel title="Model explanation" bodyClassName="p-4">
                {explanationText || topFeatures.length > 0 ? (
                  <div className="space-y-4">
                    {explanationText && <p className="text-sm">{explanationText}</p>}
                    {topFeatures.length > 0 && (
                      <ul className="space-y-2">
                        {topFeatures.map((feature) => {
                          const contribution = Math.abs(Number(feature.contribution ?? 0));
                          const width = Math.min(100, contribution <= 1 ? contribution * 100 : contribution);
                          return (
                            <li key={feature.feature} className="flex items-center gap-3">
                              <span className="w-48 truncate font-mono text-xs">{feature.feature}</span>
                              <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${width}%` }} />
                              </div>
                              <span className="w-16 text-right font-mono text-xs">
                                {feature.contribution ?? "—"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    title="No explanation available"
                    message="Explainability output was not provided for this detection."
                  />
                )}
              </Panel>
            </TabsContent>

            <TabsContent value="mitre">
              <Panel title="MITRE ATT&CK mapping" bodyClassName="p-4">
                {techniqueId ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-primary/15 text-primary rounded-md px-2 py-1 font-mono text-sm">
                        {techniqueId}
                      </span>
                      <span className="text-sm font-medium">
                        {detection.mitre?.technique_name ?? "—"}
                      </span>
                      {detection.mitre?.tactic && (
                        <span className="text-muted-foreground text-xs">
                          Tactic: {titleCase(detection.mitre.tactic)}
                        </span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/mitre/$techniqueId" params={{ techniqueId }}>
                        <Crosshair className="size-4" aria-hidden /> Open technique
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Crosshair className="size-5" />}
                    title="No ATT&CK mapping"
                    message="This detection has not been mapped to a technique."
                  />
                )}
              </Panel>
            </TabsContent>

            <TabsContent value="alerts">
              <Panel title="Related alerts" bodyClassName="divide-y">
                {relatedAlerts.isLoading ? (
                  <LoadingState label="Loading related alerts…" />
                ) : (relatedAlerts.data?.items ?? []).length === 0 ? (
                  <EmptyState
                    title="No related alerts"
                    message="No alerts have been generated from this detection."
                  />
                ) : (
                  (relatedAlerts.data?.items ?? []).map((alert) => (
                    <div key={String(alert.id)} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {alert.title ?? titleCase(alert.attack_type)}
                        </p>
                        <p className="text-muted-foreground font-mono text-xs">
                          #{String(alert.id)} · {formatDateTime(alert.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={alert.severity} />
                        <StatusBadge status={alert.status} />
                      </div>
                    </div>
                  ))
                )}
              </Panel>
            </TabsContent>
          </Tabs>
        </>
      )}
    </>
  );
}
