import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Cpu,
  Folder,
  Radar,
  ShieldAlert,
  Signal,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SeverityBadge, StatusBadge } from "@/components/common/SeverityBadge";
import { ConfidenceMeter, RiskIndicator } from "@/components/common/RiskIndicator";
import { AsyncBoundary, EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { CategoryBarChart, DonutChart, TrendChart } from "@/components/charts/AnalyticsChart";
import { dashboardService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { formatNumber, formatRelative, normalizeSeverity, titleCase } from "@/lib/format";
import { useRealtime } from "@/lib/realtime/realtime-context";
import type { DashboardTrends, TrendPoint } from "@/lib/api/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Security Dashboard — SentinelML" },
      {
        name: "description",
        content: "Real-time SOC overview of detections, alerts, incidents and model health.",
      },
      { property: "og:title", content: "Security Dashboard — SentinelML" },
      {
        property: "og:description",
        content: "Real-time SOC overview of detections, alerts, incidents and model health.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { liveEvents, dashboardStatus } = useRealtime();

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardService.summary,
  });
  const trendsQuery = useQuery({
    queryKey: ["dashboard", "trends"],
    queryFn: () => dashboardService.trends({ interval: "day", range: "7d" }),
  });
  const distributionQuery = useQuery({
    queryKey: ["dashboard", "attack-distribution"],
    queryFn: () => dashboardService.attackDistribution(),
  });

  const summary = summaryQuery.data;
  const bySeverity = summary?.alerts_by_severity ?? {};

  const trendRaw = trendsQuery.data as DashboardTrends | TrendPoint[] | undefined;
  const trendPoints: TrendPoint[] = Array.isArray(trendRaw)
    ? trendRaw
    : ((trendRaw?.trends ?? []) as TrendPoint[]);
  const trendData = trendPoints.map((p) => ({
    label: (p.date ?? p.timestamp ?? "").toString().slice(0, 16),
    detections: Number(p.detections ?? p.count ?? 0),
    alerts: Number(p.alerts ?? 0),
  }));

  const distribution = distributionQuery.data ?? [];
  const severityData = Object.entries(bySeverity)
    .filter(([, v]) => typeof v === "number")
    .map(([name, value]) => ({ name: titleCase(name), value: Number(value) }));

  const summaryError = toErrorState(summaryQuery.error);

  return (
    <>
      <PageHeader
        title="Security Operations Dashboard"
        description="Live posture across machine-learning detections, alerts, incidents and platform health."
        actions={
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Signal
              className={dashboardStatus === "open" ? "text-success size-3.5" : "text-muted-foreground size-3.5"}
              aria-hidden
            />
            Realtime: {dashboardStatus}
          </span>
        }
      />

      {summaryError && (
        <div className="bg-card rounded-lg border">
          <ErrorState message={summaryError.message} onRetry={() => void summaryQuery.refetch()} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total detections"
          value={formatNumber(summary?.total_detections ?? 0)}
          icon={Activity}
          isLoading={summaryQuery.isLoading}
          hint={summary?.detections_today !== undefined ? `${summary.detections_today} today` : undefined}
        />
        <StatCard
          label="Critical alerts"
          value={formatNumber(Number(bySeverity["critical"] ?? 0))}
          icon={ShieldAlert}
          tone="critical"
          isLoading={summaryQuery.isLoading}
          hint={`${Number(bySeverity["high"] ?? 0)} high · ${Number(bySeverity["medium"] ?? 0)} medium · ${Number(bySeverity["low"] ?? 0)} low`}
        />
        <StatCard
          label="Active incidents"
          value={formatNumber(summary?.active_incidents ?? 0)}
          icon={Folder}
          tone="high"
          isLoading={summaryQuery.isLoading}
        />
        <StatCard
          label="Current risk level"
          value={summary?.risk_level ? titleCase(summary.risk_level) : "—"}
          icon={Radar}
          tone={normalizeSeverity(summary?.risk_level) === "info" ? "info" : normalizeSeverity(summary?.risk_level)}
          isLoading={summaryQuery.isLoading}
          hint={summary?.risk_score !== undefined ? `Risk score ${summary.risk_score}` : undefined}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Detection trend"
          description="Detections and alerts over the reporting window"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <AsyncBoundary
            isLoading={trendsQuery.isLoading}
            error={toErrorState(trendsQuery.error)}
            isEmpty={trendData.length === 0}
            onRetry={() => void trendsQuery.refetch()}
            emptyTitle="No trend data yet"
            emptyMessage="Trend points appear once the detection pipeline reports activity."
          >
            <TrendChart
              data={trendData}
              xKey="label"
              series={[
                { key: "detections", label: "Detections", color: "var(--chart-1)" },
                { key: "alerts", label: "Alerts", color: "var(--chart-2)" },
              ]}
            />
          </AsyncBoundary>
        </Panel>

        <Panel title="Severity distribution" description="Alerts grouped by severity" bodyClassName="p-4">
          <AsyncBoundary
            isLoading={summaryQuery.isLoading}
            error={null}
            isEmpty={severityData.length === 0}
            emptyTitle="No alerts recorded"
            emptyMessage="Severity breakdown appears when alerts are generated."
          >
            <DonutChart data={severityData} nameKey="name" valueKey="value" />
          </AsyncBoundary>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Attack distribution"
          description="Detections by attack category"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <AsyncBoundary
            isLoading={distributionQuery.isLoading}
            error={toErrorState(distributionQuery.error)}
            isEmpty={distribution.length === 0}
            onRetry={() => void distributionQuery.refetch()}
            emptyTitle="No attack categories yet"
          >
            <CategoryBarChart
              data={distribution.map((d) => ({ name: titleCase(d.attack_type), count: d.count }))}
              xKey="name"
              yKey="count"
              horizontal

              height={280}
            />
          </AsyncBoundary>
        </Panel>

        <div className="space-y-4">
          <Panel title="Model status" bodyClassName="divide-y">
            {summaryQuery.isLoading ? (
              <LoadingState label="Loading models…" />
            ) : (summary?.models ?? []).length === 0 ? (
              <EmptyState
                icon={<Cpu className="size-5" />}
                title="No models reported"
                message="The backend has not published model status."
              />
            ) : (
              (summary?.models ?? []).slice(0, 4).map((model) => (
                <div key={String(model.id)} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{model.name ?? `Model ${model.id}`}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {model.algorithm ?? "—"} · v{model.version ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={model.status} />
                </div>
              ))
            )}
          </Panel>

          <Panel title="System status" bodyClassName="p-4">
            {summary?.system_status ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(summary.system_status)
                  .filter(([, v]) => typeof v === "string" || typeof v === "number")
                  .slice(0, 8)
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-muted-foreground text-[11px] tracking-wider uppercase">
                        {titleCase(key)}
                      </dt>
                      <dd className="font-mono text-sm">{String(value)}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">
                System status is not being reported by the API yet.
              </p>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Recent alerts"
          actions={
            <Link to="/alerts" className="text-primary text-xs hover:underline">
              View all
            </Link>
          }
          bodyClassName="divide-y"
        >
          {summaryQuery.isLoading ? (
            <LoadingState label="Loading alerts…" />
          ) : (summary?.recent_alerts ?? []).length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="size-5" />}
              title="No recent alerts"
              message="New alerts stream in over the realtime channel."
            />
          ) : (
            (summary?.recent_alerts ?? []).slice(0, 6).map((alert) => (
              <Link
                key={String(alert.id)}
                to="/alerts"
                className="hover:bg-accent/40 flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {alert.title ?? titleCase(alert.attack_type)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {alert.source_ip ?? "unknown source"} · {formatRelative(alert.timestamp)}
                  </p>
                </div>
                <SeverityBadge severity={alert.severity} />
              </Link>
            ))
          )}
        </Panel>

        <Panel
          title="Recent detections"
          actions={
            <Link to="/detections" className="text-primary text-xs hover:underline">
              View all
            </Link>
          }
          bodyClassName="divide-y"
        >
          {summaryQuery.isLoading ? (
            <LoadingState label="Loading detections…" />
          ) : (summary?.recent_detections ?? []).length === 0 ? (
            <EmptyState
              icon={<Activity className="size-5" />}
              title="No recent detections"
              message="Detections appear after the ML pipeline classifies traffic."
            />
          ) : (
            (summary?.recent_detections ?? []).slice(0, 6).map((detection) => (
              <Link
                key={String(detection.id)}
                to="/detections/$id"
                params={{ id: String(detection.id) }}
                className="hover:bg-accent/40 block px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">
                    {titleCase(detection.attack_type ?? detection.prediction)}
                  </p>
                  <SeverityBadge severity={detection.severity} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <ConfidenceMeter confidence={detection.confidence} compact />
                  <RiskIndicator score={detection.risk_score} compact />
                  <span className="text-muted-foreground text-xs">
                    {formatRelative(detection.timestamp)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </Panel>
      </div>

      <Panel title="Live event stream" description="Messages received over the WebSocket channels">
        {liveEvents.length === 0 ? (
          <EmptyState
            icon={<Signal className="size-5" />}
            title="No live events yet"
            message="Events appear here as soon as the backend publishes to /ws/dashboard or /ws/alerts."
          />
        ) : (
          <ul className="divide-y">
            {liveEvents.slice(0, 8).map((event, index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-2 font-mono text-xs">
                <span className="text-primary">{String(event["__channel"] ?? "event")}</span>
                <span className="text-muted-foreground truncate">
                  {JSON.stringify(event.data ?? event.payload ?? event).slice(0, 160)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
