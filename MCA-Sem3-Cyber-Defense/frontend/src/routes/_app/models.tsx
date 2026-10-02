import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/SeverityBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { modelService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { formatDateTime, formatPercent, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_app/models")({
  head: () => ({
    meta: [
      { title: "ML Models — SentinelML" },
      {
        name: "description",
        content: "Detection model inventory, versions and performance metrics served by the backend.",
      },
      { property: "og:title", content: "ML Models — SentinelML" },
      {
        property: "og:description",
        content: "Detection model inventory, versions and performance metrics served by the backend.",
      },
    ],
  }),
  component: ModelsPage,
});

function ModelsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["models"], queryFn: modelService.list });
  const detail = useQuery({
    queryKey: ["models", "detail", selectedId],
    queryFn: () => modelService.get(selectedId as string),
    enabled: Boolean(selectedId),
  });

  const models = query.data?.items ?? [];
  const error = toErrorState(query.error);
  const model = detail.data;

  return (
    <>
      <PageHeader
        title="Machine Learning Models"
        description="Models used for classification and risk scoring. Inference runs entirely on the backend."
      />

      <Panel>
        {query.isLoading ? (
          <LoadingState label="Loading model registry…" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        ) : models.length === 0 ? (
          <EmptyState
            icon={<Cpu className="size-5" />}
            title="No models registered"
            message="The backend has not published any detection models."
          />
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {models.map((m) => (
              <button
                key={String(m.id)}
                type="button"
                onClick={() => setSelectedId(String(m.id))}
                className="bg-card hover:border-primary/50 rounded-lg border p-4 text-left transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.name ?? `Model ${m.id}`}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.algorithm ?? "—"} · v{m.version ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Accuracy</p>
                    <p className="font-mono">{formatPercent(m.metrics?.accuracy)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">F1 score</p>
                    <p className="font-mono">{formatPercent(m.metrics?.f1_score)}</p>
                  </div>
                </div>
                <p className="text-muted-foreground mt-3 text-xs">
                  Detection type: {titleCase(m.detection_type)}
                </p>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{model?.name ?? "Model detail"}</SheetTitle>
            <SheetDescription>
              {model ? `${model.algorithm ?? "—"} · version ${model.version ?? "—"}` : "Loading…"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            {detail.isLoading ? (
              <LoadingState label="Loading model…" />
            ) : detail.error ? (
              <ErrorState
                message={toErrorState(detail.error)?.message}
                onRetry={() => void detail.refetch()}
              />
            ) : model ? (
              <>
                <StatusBadge status={model.status} />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      detection_type
                    </p>
                    <p>{titleCase(model.detection_type)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      trained_at
                    </p>
                    <p className="font-mono text-xs">{formatDateTime(model.trained_at)}</p>
                  </div>
                </div>

                {model.metrics && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-[11px] tracking-wider uppercase">
                      Performance metrics
                    </p>
                    <dl className="grid grid-cols-2 gap-3">
                      {Object.entries(model.metrics)
                        .filter(([, v]) => typeof v === "number")
                        .map(([key, value]) => (
                          <div key={key} className="bg-secondary/40 rounded-md border p-3">
                            <dt className="text-muted-foreground text-xs">{titleCase(key)}</dt>
                            <dd className="mt-0.5 font-mono text-base font-semibold">
                              {formatPercent(value)}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                )}

                {(model.classes ?? []).length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-[11px] tracking-wider uppercase">
                      Supported classes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(model.classes ?? []).map((c) => (
                        <span key={c} className="bg-secondary rounded px-2 py-0.5 font-mono text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
