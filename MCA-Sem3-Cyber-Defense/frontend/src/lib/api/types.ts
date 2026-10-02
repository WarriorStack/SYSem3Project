/**
 * Data contract shared with the FastAPI backend.
 *
 * Backend field names (snake_case) are preserved verbatim. Optional markers are
 * used where the contract does not guarantee a field so the UI degrades
 * gracefully instead of crashing.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type UserRole = "admin" | "analyst" | "viewer" | string;

export interface User {
  id: string | number;
  name?: string | undefined;
  email: string;
  role?: UserRole | undefined;
  is_active?: boolean | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  last_login?: string | undefined;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type?: string | undefined;
  expires_in?: number | undefined;
  user?: User | undefined;
}

export interface MitreMapping {
  technique_id: string;
  technique_name?: string | undefined;
  tactic?: string | undefined;
  url?: string | undefined;
}

export interface Detection {
  id: string | number;
  timestamp: string;
  source_ip?: string | undefined;
  source_port?: number | undefined;
  destination_ip?: string | undefined;
  destination_port?: number | undefined;
  protocol?: string | undefined;
  attack_type?: string | undefined;
  prediction?: string | undefined;
  confidence?: number | undefined;
  severity?: Severity | string | undefined;
  risk_score?: number | undefined;
  status?: string | undefined;
  model_id?: string | number | undefined;
  model_name?: string | undefined;
  explanation?: DetectionExplanation | string | null | undefined;
  mitre?: MitreMapping | null | undefined;
  technique_id?: string | undefined;
  recommended_action?: string | undefined;
  features?: Record<string, number | string | null> | undefined;
}

export interface DetectionExplanation {
  summary?: string | undefined;
  method?: string | undefined;
  top_features?: Array<{
    feature: string;
    value?: number | string | undefined;
    contribution?: number | undefined;
  }>;
}

export interface AnalyzeResult {
  id?: string | number | undefined;
  prediction?: string | undefined;
  attack_type?: string | undefined;
  confidence?: number | undefined;
  severity?: Severity | string | undefined;
  risk_score?: number | undefined;
  explanation?: DetectionExplanation | string | null | undefined;
  mitre?: MitreMapping | null | undefined;
  recommended_action?: string | undefined;
  timestamp?: string | undefined;
}

/**
 * Response returned by:
 * POST /api/detection/analyze
 *
 * FastAPI returns the detection inside a `detection` wrapper together
 * with alert creation information.
 */
export interface AnalyzeResponse {
  detection: AnalyzeResult;
  alert_created: boolean;
  alert_id?: string | number | null;
}

export interface Alert {
  id: string | number;
  timestamp: string;
  severity?: Severity | string | undefined;
  attack_type?: string | undefined;
  risk_score?: number | undefined;
  source_ip?: string | undefined;
  status?: string | undefined;
  detection_id?: string | number | undefined;
  title?: string | undefined;
  description?: string | undefined;
  assigned_to?: string | undefined;
  resolved_at?: string | undefined;
  resolution_note?: string | undefined;
}

export interface Incident {
  id: string | number;
  title: string;
  description?: string | undefined;
  severity?: Severity | string | undefined;
  status?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  assigned_to?: string | null | undefined;
  alert_ids?: Array<string | number> | undefined;
  alerts?: Alert[] | undefined;
}

export interface Threat {
  id: string | number;
  name?: string | undefined;
  attack_type?: string | undefined;
  category?: string | undefined;
  description?: string | undefined;
  severity?: Severity | string | undefined;
  detection_count?: number | undefined;
  last_seen?: string | undefined;
  first_seen?: string | undefined;
  technique_id?: string | undefined;
  indicators?: string[] | undefined;
  recommended_action?: string | undefined;
}

export interface MitreTechnique {
  technique_id: string;
  name?: string | undefined;
  description?: string | undefined;
  tactic?: string | undefined;
  attack_category?: string | undefined;
  detection_count?: number | undefined;
  incident_count?: number | undefined;
  url?: string | undefined;
  detections?: Detection[] | undefined;
  incidents?: Incident[] | undefined;
}

export interface Model {
  id: string | number;
  name?: string | undefined;
  algorithm?: string | undefined;
  version?: string | undefined;
  status?: string | undefined;
  detection_type?: string | undefined;
  trained_at?: string | undefined;
  metrics?: {
    accuracy?: number | undefined;
    precision?: number | undefined;
    recall?: number | undefined;
    f1_score?: number | undefined;
    roc_auc?: number | undefined;
    [key: string]: number | undefined;
  };
  features?: string[] | undefined;
  classes?: string[] | undefined;
}

export interface AuditLog {
  id: string | number;
  timestamp?: string | undefined;
  user_id?: string | number | undefined;
  user_email?: string | undefined;
  action?: string | undefined;
  resource?: string | undefined;
  ip_address?: string | undefined;
  status?: string | undefined;
  details?: string | undefined;
}

export interface DashboardSummary {
  total_detections?: number | undefined;
  total_alerts?: number | undefined;
  active_incidents?: number | undefined;
  risk_level?: string | undefined;
  risk_score?: number | undefined;
  alerts_by_severity?: Partial<Record<Severity, number>> &
    Record<string, number | undefined>;
  detections_today?: number | undefined;
  models_active?: number | undefined;
  system_status?: SystemStatus | undefined;
  recent_alerts?: Alert[] | undefined;
  recent_detections?: Detection[] | undefined;
  top_attack_types?: Array<{
    attack_type: string;
    count: number;
  }> | undefined;
  models?: Model[] | undefined;
}

export interface SystemStatus {
  status?: string | undefined;
  api?: string | undefined;
  database?: string | undefined;
  model_service?: string | undefined;
  websocket?: string | undefined;
  uptime?: number | string | undefined;
  version?: string | undefined;
  cpu_usage?: number | undefined;
  memory_usage?: number | undefined;
  [key: string]: unknown;
}

export interface TrendPoint {
  timestamp?: string | undefined;
  date?: string | undefined;
  count?: number | undefined;
  detections?: number | undefined;
  alerts?: number | undefined;
  risk_score?: number | undefined;
  [key: string]: unknown;
}

export interface DashboardTrends {
  trends?: TrendPoint[] | undefined;
  interval?: string | undefined;
}

export interface AttackDistributionItem {
  attack_type: string;
  count: number;
  percentage?: number | undefined;
}

export interface AnalyticsOverview {
  total_detections?: number | undefined;
  total_alerts?: number | undefined;
  total_incidents?: number | undefined;
  average_risk_score?: number | undefined;
  average_confidence?: number | undefined;
  severity_distribution?: Record<string, number> | undefined;
  detection_trends?: TrendPoint[] | undefined;
  confidence_distribution?: Array<{
    bucket: string;
    count: number;
  }> | undefined;
  hourly_patterns?: Array<{
    hour: number | string;
    count: number;
  }> | undefined;
}

export interface AnalyticsAttacks {
  attacks?: Array<{
    attack_type: string;
    count: number;
    average_risk_score?: number | undefined;
    average_confidence?: number | undefined;
    severity?: string | undefined;
  }>;
  total?: number | undefined;
}

export interface AnalyticsRisk {
  average_risk_score?: number | undefined;
  risk_distribution?: Array<{
    range?: string;
    bucket?: string;
    count: number;
  }> | undefined;
  risk_trends?: TrendPoint[] | undefined;
}

export interface ReportSummary {
  id?: string | number | undefined;
  title?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  generated_at?: string | undefined;
  detection_stats?: Record<string, number> | undefined;
  attack_stats?: Array<{
    attack_type: string;
    count: number;
  }> | undefined;
  severity_stats?: Record<string, number> | undefined;
  risk_summary?: {
    average_risk_score?: number;
    max_risk_score?: number;
    [k: string]: unknown;
  } | undefined;
  notable_incidents?: Incident[] | undefined;
}

/** Generic paginated envelope. Falls back to plain arrays when the backend
 *  returns an unwrapped list. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages?: number | undefined;
}

export interface ApiErrorShape {
  status: number;
  message: string;
  fieldErrors?: Record<string, string> | undefined;
  detail?: unknown | undefined;
}