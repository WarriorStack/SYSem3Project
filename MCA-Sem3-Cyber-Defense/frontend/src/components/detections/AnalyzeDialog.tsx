import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ScanSearch } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { SeverityBadge } from "@/components/common/SeverityBadge";
import {
  ConfidenceMeter,
  RiskIndicator,
} from "@/components/common/RiskIndicator";

import { ErrorState } from "@/components/common/States";

import { detectionService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { titleCase } from "@/lib/format";

import type {
  AnalyzeResponse,
  AnalyzeResult,
} from "@/lib/api/types";

/**
 * Analyze network/security event.
 *
 * The frontend only collects and sends the network-flow features.
 * Classification is performed entirely by the backend ML pipeline.
 *
 * Backend endpoint:
 * POST /api/detection/analyze
 *
 * Expected backend response:
 * {
 *   detection: {...},
 *   alert_created: boolean,
 *   alert_id: number | null
 * }
 */
export function AnalyzeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [sourceIp, setSourceIp] = useState("");
  const [destinationIp, setDestinationIp] = useState("");
  const [protocol, setProtocol] = useState("");
  const [sourcePort, setSourcePort] = useState("");
  const [destinationPort, setDestinationPort] = useState("");

  const [featuresJson, setFeaturesJson] = useState("{\n  \n}");

  const [jsonError, setJsonError] = useState<string | null>(null);

  /**
   * Only the detection object is stored here because that is what
   * the Result tab displays.
   */
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const mutation = useMutation({
    mutationFn: (
      payload: Record<string, unknown>,
    ): Promise<AnalyzeResponse> =>
      detectionService.analyze(payload),

    onSuccess: (data) => {
      /**
       * Backend response is wrapped:
       *
       * {
       *   detection: {...},
       *   alert_created: false,
       *   alert_id: null
       * }
       *
       * Therefore we store data.detection.
       */
      setResult(data.detection);
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    setJsonError(null);

    let features: Record<string, unknown> = {};

    /*
     * Parse the feature JSON entered by the user.
     */
    if (featuresJson.trim()) {
      try {
        const parsed = JSON.parse(featuresJson) as unknown;

        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          setJsonError("Features must be a JSON object.");
          return;
        }

        features = parsed as Record<string, unknown>;
      } catch {
        setJsonError("Features must be valid JSON.");
        return;
      }
    }

    /*
     * IMPORTANT:
     *
     * The FastAPI backend expects:
     *
     * {
     *   "features": {
     *      "flow_duration": ...,
     *      "source_ip": ...,
     *      "destination_ip": ...,
     *      "protocol": ...,
     *      ...
     *   }
     * }
     *
     * Therefore network metadata is merged INTO features.
     */
    const payload: Record<string, unknown> = {
      features: {
        ...features,

        ...(sourceIp
          ? { source_ip: sourceIp }
          : {}),

        ...(destinationIp
          ? { destination_ip: destinationIp }
          : {}),

        ...(protocol
          ? { protocol }
          : {}),

        ...(sourcePort
          ? { source_port: Number(sourcePort) }
          : {}),

        ...(destinationPort
          ? { destination_port: Number(destinationPort) }
          : {}),
      },
    };

    /*
     * Submit exactly once.
     */
    mutation.mutate(payload);
  };

  const error = toErrorState(mutation.error);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch
              className="text-primary size-4"
              aria-hidden
            />

            Analyze network event
          </DialogTitle>

          <DialogDescription>
            Sends the feature payload to the detection service.
            Classification is performed entirely by the backend
            models.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="input">
          <TabsList>
            <TabsTrigger value="input">
              Input
            </TabsTrigger>

            <TabsTrigger
              value="result"
              disabled={!result}
            >
              Result
            </TabsTrigger>
          </TabsList>

          {/* ========================= INPUT ========================= */}

          <TabsContent value="input">
            <form
              onSubmit={submit}
              className="space-y-4"
            >
              {/* Network metadata */}

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Source IP */}

                <div className="space-y-1.5">
                  <Label htmlFor="src-ip">
                    source_ip
                  </Label>

                  <Input
                    id="src-ip"
                    value={sourceIp}
                    onChange={(e) =>
                      setSourceIp(e.target.value)
                    }
                    placeholder="192.168.1.10"
                  />
                </div>

                {/* Destination IP */}

                <div className="space-y-1.5">
                  <Label htmlFor="dst-ip">
                    destination_ip
                  </Label>

                  <Input
                    id="dst-ip"
                    value={destinationIp}
                    onChange={(e) =>
                      setDestinationIp(e.target.value)
                    }
                    placeholder="192.168.1.20"
                  />
                </div>

                {/* Source port */}

                <div className="space-y-1.5">
                  <Label htmlFor="src-port">
                    source_port
                  </Label>

                  <Input
                    id="src-port"
                    type="number"
                    value={sourcePort}
                    onChange={(e) =>
                      setSourcePort(e.target.value)
                    }
                    placeholder="49152"
                  />
                </div>

                {/* Destination port */}

                <div className="space-y-1.5">
                  <Label htmlFor="dst-port">
                    destination_port
                  </Label>

                  <Input
                    id="dst-port"
                    type="number"
                    value={destinationPort}
                    onChange={(e) =>
                      setDestinationPort(e.target.value)
                    }
                    placeholder="80"
                  />
                </div>

                {/* Protocol */}

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="protocol">
                    protocol
                  </Label>

                  <Input
                    id="protocol"
                    value={protocol}
                    onChange={(e) =>
                      setProtocol(e.target.value)
                    }
                    placeholder="TCP"
                  />
                </div>
              </div>

              {/* Feature JSON */}

              <div className="space-y-1.5">
                <Label htmlFor="features">
                  features (JSON object)
                </Label>

                <Textarea
                  id="features"
                  value={featuresJson}
                  onChange={(e) =>
                    setFeaturesJson(e.target.value)
                  }
                  rows={8}
                  className="font-mono text-xs"
                  aria-invalid={Boolean(jsonError)}
                />

                <p className="text-muted-foreground text-xs">
                  Use the exact feature names expected by the
                  backend detection schema.
                </p>

                {jsonError && (
                  <p className="text-destructive text-xs">
                    {jsonError}
                  </p>
                )}
              </div>

              {/* API error */}

              {error && (
                <ErrorState
                  title="Analysis failed"
                  message={error.message}
                />
              )}

              {/* Buttons */}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    onOpenChange(false)
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden
                    />
                  )}

                  Run analysis
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* ========================= RESULT ========================= */}

          <TabsContent value="result">
            {result && (
              <div className="space-y-4">

                {/* Prediction + Severity */}

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Prediction */}

                  <div className="bg-secondary/40 rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      Prediction
                    </p>

                    <p className="mt-1 text-base font-semibold">
                      {titleCase(
                        result.prediction ?? "unknown",
                      )}
                    </p>

                    <p className="text-muted-foreground text-xs">
                      Attack type:{" "}
                      {titleCase(
                        result.attack_type ?? "unknown",
                      )}
                    </p>
                  </div>

                  {/* Severity */}

                  <div className="bg-secondary/40 flex items-center justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      Severity
                    </span>

                    <SeverityBadge
                      severity={
                        result.severity ?? "low"
                      }
                    />
                  </div>
                </div>

                {/* Confidence + Risk */}

                <div className="grid gap-4 sm:grid-cols-2">

                  <ConfidenceMeter
                    confidence={
                      result.confidence ?? 0
                    }
                  />

                  <RiskIndicator
                    score={
                      result.risk_score ?? 0
                    }
                  />
                </div>

                {/* MITRE */}

                {result.mitre?.technique_id && (
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      MITRE ATT&CK
                    </p>

                    <p className="mt-1 text-sm">
                      <span className="text-primary font-mono">
                        {result.mitre.technique_id}
                      </span>{" "}

                      {result.mitre.technique_name ??
                        ""}
                    </p>
                  </div>
                )}

                {/* Explanation */}

                {result.explanation && (
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      Explanation
                    </p>

                    <p className="mt-1 text-sm">
                      {typeof result.explanation ===
                      "string"
                        ? result.explanation
                        : (
                            result.explanation
                              .summary ?? "—"
                          )}
                    </p>
                  </div>
                )}

                {/* Recommended action */}

                {result.recommended_action && (
                  <div className="border-primary/40 bg-primary/5 rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      Recommended action
                    </p>

                    <p className="mt-1 text-sm">
                      {result.recommended_action}
                    </p>
                  </div>
                )}

              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}