import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Activity, ScanSearch } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { SearchFilter } from "@/components/common/SearchFilter";
import { Pagination } from "@/components/common/Pagination";
import { SeverityBadge, StatusBadge } from "@/components/common/SeverityBadge";
import { ConfidenceMeter, RiskIndicator } from "@/components/common/RiskIndicator";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnalyzeDialog } from "@/components/detections/AnalyzeDialog";
import { detectionService } from "@/lib/api/services";
import { PAGE_SIZE, SEVERITY_OPTIONS, toErrorState } from "@/lib/api/query";
import { formatDateTime, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_app/detections/")({
  head: () => ({
    meta: [
      { title: "Detections — SentinelML" },
      {
        name: "description",
        content: "Browse machine-learning network threat detections with severity and risk scoring.",
      },
      { property: "og:title", content: "Detections — SentinelML" },
      {
        property: "og:description",
        content: "Browse machine-learning network threat detections with severity and risk scoring.",
      },
    ],
  }),
  component: DetectionsPage,
});

function DetectionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("all");
  const [attackType, setAttackType] = useState("all");
  const [prediction, setPrediction] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [analyzeOpen, setAnalyzeOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      severity,
      attack_type: attackType,
      prediction,
      status,
      start_date: dateFrom,
      end_date: dateTo,
    }),
    [page, severity, attackType, prediction, status, dateFrom, dateTo],
  );

  const query = useQuery({
    queryKey: ["detections", params],
    queryFn: () => detectionService.list(params),
    placeholderData: keepPreviousData,
  });

  const items = query.data?.items ?? [];
  const error = toErrorState(query.error);

  const attackOptions = useMemo(() => {
    const set = new Set(items.map((d) => d.attack_type).filter(Boolean) as string[]);
    return [
      { label: "All attack types", value: "all" },
      ...[...set].map((v) => ({ label: titleCase(v), value: v })),
    ];
  }, [items]);

  const predictionOptions = useMemo(() => {
    const set = new Set(items.map((d) => d.prediction).filter(Boolean) as string[]);
    return [
      { label: "All predictions", value: "all" },
      ...[...set].map((v) => ({ label: titleCase(v), value: v })),
    ];
  }, [items]);

  const statusOptions = useMemo(() => {
    const set = new Set(items.map((d) => d.status).filter(Boolean) as string[]);
    return [
      { label: "All statuses", value: "all" },
      ...[...set].map((v) => ({ label: titleCase(v), value: v })),
    ];
  }, [items]);

  const reset = () => {
    setSeverity("all");
    setAttackType("all");
    setPrediction("all");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Detections"
        description="Classified network events produced by the detection models."
        actions={
          <Button onClick={() => setAnalyzeOpen(true)}>
            <ScanSearch className="size-4" aria-hidden /> Analyze traffic
          </Button>
        }
      />

      <Panel>
        <SearchFilter
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
              key: "attack_type",
              label: "Attack type",
              value: attackType,
              options: attackOptions,
              onChange: (v) => {
                setAttackType(v);
                setPage(1);
              },
            },
            {
              key: "prediction",
              label: "Prediction",
              value: prediction,
              options: predictionOptions,
              onChange: (v) => {
                setPrediction(v);
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
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={(v) => {
            setDateFrom(v);
            setPage(1);
          }}
          onDateToChange={(v) => {
            setDateTo(v);
            setPage(1);
          }}
          onReset={reset}
        />

        {query.isLoading ? (
          <TableSkeleton cols={8} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Activity className="size-5" />}
            title="No detections match these filters"
            message="Adjust the filters or wait for the detection pipeline to report new events."
            action={
              <Button variant="outline" size="sm" onClick={reset}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Attack type</TableHead>
                  <TableHead>Prediction</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((detection) => (
                  <TableRow
                    key={String(detection.id)}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({ to: "/detections/$id", params: { id: String(detection.id) } })
                    }
                  >
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {formatDateTime(detection.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {detection.source_ip ?? "—"}
                      {detection.source_port ? `:${detection.source_port}` : ""}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {detection.destination_ip ?? "—"}
                      {detection.destination_port ? `:${detection.destination_port}` : ""}
                    </TableCell>
                    <TableCell className="text-xs uppercase">{detection.protocol ?? "—"}</TableCell>
                    <TableCell className="text-sm">{titleCase(detection.attack_type)}</TableCell>
                    <TableCell className="text-sm">{titleCase(detection.prediction)}</TableCell>
                    <TableCell>
                      <ConfidenceMeter confidence={detection.confidence} compact />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={detection.severity} />
                    </TableCell>
                    <TableCell>
                      <RiskIndicator score={detection.risk_score} compact />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={detection.status} />
                    </TableCell>
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

      <AnalyzeDialog open={analyzeOpen} onOpenChange={setAnalyzeOpen} />
    </>
  );
}
