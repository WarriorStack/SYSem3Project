import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { AsyncBoundary } from "@/components/common/States";
import { CategoryBarChart, DonutChart, TrendChart } from "@/components/charts/AnalyticsChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyticsService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { formatNumber, formatPercent, titleCase } from "@/lib/format";
import { Activity, BarChart3, Gauge, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Security Analytics — SentinelML" },
      {
        name: "description",
        content: "Attack frequency, severity distribution, risk trends and confidence analytics.",
      },
      { property: "og:title", content: "Security Analytics — SentinelML" },
      {
        property: "og:description",
        content: "Attack frequency, severity distribution, risk trends and confidence analytics.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const RANGES = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

function AnalyticsPage() {
  const [range, setRange] = useState("7d");

  const overview = useQuery({
    queryKey: ["analytics", "overview", range],
    queryFn: () => analyticsService.overview({ range }),
  });
  const attacks = useQuery({
    queryKey: ["analytics", "attacks", range],
    queryFn: () => analyticsService.attacks({ range }),
  });
  const risk = useQuery({
    queryKey: ["analytics", "risk", range],
    queryFn: () => analyticsService.risk({ range }),
  });

  const o = overview.data;
  const severityData = Object.entries(o?.severity_distribution ?? {}).map(([name, value]) => ({
    name: titleCase(name),
    value: Number(value),
  }));
  const trendData = (o?.detection_trends ?? []).map((p) => ({
    label: (p.date ?? p.timestamp ?? "").toString().slice(0, 16),
    detections: Number(p.detections ?? p.count ?? 0),
  }));
  const confidenceData = (o?.confidence_distribution ?? []).map((c) => ({
    bucket: c.bucket,
    count: c.count,
  }));
  const hourlyData = (o?.hourly_patterns ?? []).map((h) => ({
    hour: String(h.hour),
    count: h.count,
  }));
  const attackRows = attacks.data?.attacks ?? [];
  const riskTrend = (risk.data?.risk_trends ?? []).map((p) => ({
    label: (p.date ?? p.timestamp ?? "").toString().slice(0, 16),
    risk_score: Number(p.risk_score ?? p.count ?? 0),
  }));
  const riskDistribution = (risk.data?.risk_distribution ?? []).map((r) => ({
    name: r.range ?? r.bucket ?? "—",
    count: r.count,
  }));

  return (
    <>
      <PageHeader
        title="Security Analytics"
        description="Aggregated behaviour of the detection pipeline across the selected window."
        actions={
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[170px]" aria-label="Time range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Detections"
          value={formatNumber(o?.total_detections ?? 0)}
          icon={Activity}
          isLoading={overview.isLoading}
        />
        <StatCard
          label="Alerts"
          value={formatNumber(o?.total_alerts ?? 0)}
          icon={ShieldAlert}
          tone="high"
          isLoading={overview.isLoading}
        />
        <StatCard
          label="Average risk score"
          value={formatNumber(o?.average_risk_score ?? risk.data?.average_risk_score ?? 0)}
          icon={Gauge}
          tone="medium"
          isLoading={overview.isLoading}
        />
        <StatCard
          label="Average confidence"
          value={formatPercent(o?.average_confidence)}
          icon={BarChart3}
          tone="info"
          isLoading={overview.isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Detection trend" className="xl:col-span-2" bodyClassName="p-4">
          <AsyncBoundary
            isLoading={overview.isLoading}
            error={toErrorState(overview.error)}
            isEmpty={trendData.length === 0}
            onRetry={() => void overview.refetch()}
            emptyTitle="No trend data for this window"
          >
            <TrendChart data={trendData} xKey="label" series={[{ key: "detections", label: "Detections" }]} />
          </AsyncBoundary>
        </Panel>

        <Panel title="Severity distribution" bodyClassName="p-4">
          <AsyncBoundary
            isLoading={overview.isLoading}
            error={null}
            isEmpty={severityData.length === 0}
            emptyTitle="No severity data"
          >
            <DonutChart data={severityData} nameKey="name" valueKey="value" />
          </AsyncBoundary>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Risk trend" bodyClassName="p-4">
          <AsyncBoundary
            isLoading={risk.isLoading}
            error={toErrorState(risk.error)}
            isEmpty={riskTrend.length === 0}
            onRetry={() => void risk.refetch()}
            emptyTitle="No risk trend data"
          >
            <TrendChart
              data={riskTrend}
              xKey="label"
              area={false}
              series={[{ key: "risk_score", label: "Risk score", color: "var(--chart-3)" }]}
            />
          </AsyncBoundary>
        </Panel>

        <Panel title="Risk distribution" bodyClassName="p-4">
          <AsyncBoundary
            isLoading={risk.isLoading}
            error={null}
            isEmpty={riskDistribution.length === 0}
            emptyTitle="No risk distribution data"
          >
            <CategoryBarChart data={riskDistribution} xKey="name" yKey="count" />
          </AsyncBoundary>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Confidence distribution" bodyClassName="p-4">
          <AsyncBoundary
            isLoading={overview.isLoading}
            error={null}
            isEmpty={confidenceData.length === 0}
            emptyTitle="No confidence buckets reported"
          >
            <CategoryBarChart data={confidenceData} xKey="bucket" yKey="count" colorByIndex={false} />
          </AsyncBoundary>
        </Panel>

        <Panel title="Time-based patterns" description="Detections by hour of day" bodyClassName="p-4">
          <AsyncBoundary
            isLoading={overview.isLoading}
            error={null}
            isEmpty={hourlyData.length === 0}
            emptyTitle="No hourly pattern data"
          >
            <CategoryBarChart data={hourlyData} xKey="hour" yKey="count" colorByIndex={false} />
          </AsyncBoundary>
        </Panel>
      </div>

      <Panel title="Attack frequency" description="Breakdown by attack category">
        <AsyncBoundary
          isLoading={attacks.isLoading}
          error={toErrorState(attacks.error)}
          isEmpty={attackRows.length === 0}
          onRetry={() => void attacks.refetch()}
          emptyTitle="No attack analytics yet"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attack type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Average risk score</TableHead>
                  <TableHead>Average confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attackRows.map((row) => (
                  <TableRow key={row.attack_type}>
                    <TableCell className="text-sm font-medium">{titleCase(row.attack_type)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatNumber(row.count)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatNumber(row.average_risk_score ?? null)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatPercent(row.average_confidence)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AsyncBoundary>
      </Panel>
    </>
  );
}
