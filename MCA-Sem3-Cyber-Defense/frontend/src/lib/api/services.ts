import { api, normalizeList } from "./client";
import type {
  Alert,
  AnalyticsAttacks,
  AnalyticsOverview,
  AnalyticsRisk,
  AnalyzeResponse,
  AttackDistributionItem,
  AuditLog,
  AuthTokenResponse,
  DashboardSummary,
  DashboardTrends,
  Detection,
  Incident,
  MitreTechnique,
  Model,
  Paginated,
  ReportSummary,
  SystemStatus,
  Threat,
  User,
} from "./types";

export type QueryParams = Record<
  string,
  string | number | boolean | undefined
>;

function clean(params?: QueryParams): QueryParams {
  if (!params) return {};

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== "" && v !== "all",
    ),
  );
}

/* ---------------------------------- auth --------------------------------- */

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post<AuthTokenResponse>("/auth/login", {
      email,
      password,
    });

    return data;
  },

  async register(name: string, email: string, password: string) {
    const { data } = await api.post<AuthTokenResponse | User>(
      "/auth/register",
      {
        name,
        email,
        password,
      },
    );

    return data;
  },

  async me() {
    const { data } = await api.get<User>("/auth/me");

    return data;
  },

  async logout() {
    await api.post("/auth/logout");
  },
};

/* -------------------------------- dashboard ------------------------------- */

export const dashboardService = {
  async summary() {
    const { data } = await api.get<DashboardSummary>(
      "/dashboard/summary",
    );

    return data;
  },

  async trends(params?: QueryParams) {
    const { data } = await api.get<DashboardTrends | unknown[]>(
      "/dashboard/trends",
      {
        params: clean(params),
      },
    );

    return data;
  },

  async attackDistribution(params?: QueryParams) {
    const {
      data,
    } = await api.get<
      AttackDistributionItem[] | {
        items: AttackDistributionItem[];
      }
    >("/dashboard/attack-distribution", {
      params: clean(params),
    });

    return normalizeList<AttackDistributionItem>(data).items;
  },
};

/* -------------------------------- detection ------------------------------- */

export const detectionService = {
  async list(params?: QueryParams): Promise<Paginated<Detection>> {
    const { data } = await api.get("/detection", {
      params: clean(params),
    });

    return normalizeList<Detection>(
      data,
      Number(params?.["page"] ?? 1),
      Number(params?.["page_size"] ?? 25),
    );
  },

  async get(id: string) {
    const { data } = await api.get<Detection>(
      `/detection/${id}`,
    );

    return data;
  },

  /**
   * Analyze a single network flow.
   *
   * Backend response:
   * {
   *   detection: {...},
   *   alert_created: boolean,
   *   alert_id: number | null
   * }
   */
  async analyze(
    payload: Record<string, unknown>,
  ): Promise<AnalyzeResponse> {
    const { data } = await api.post<AnalyzeResponse>(
      "/detection/analyze",
      payload,
    );

    return data;
  },

  async batch(payload: Record<string, unknown>) {
    const {
      data,
    } = await api.post<
      AnalyzeResponse[] | {
        results: AnalyzeResponse[];
      }
    >("/detection/batch", payload);

    return data;
  },
};

/* --------------------------------- alerts --------------------------------- */

export const alertService = {
  async list(params?: QueryParams): Promise<Paginated<Alert>> {
    const { data } = await api.get("/alerts", {
      params: clean(params),
    });

    return normalizeList<Alert>(
      data,
      Number(params?.["page"] ?? 1),
      Number(params?.["page_size"] ?? 25),
    );
  },

  async get(id: string) {
    const { data } = await api.get<Alert>(
      `/alerts/${id}`,
    );

    return data;
  },

  async update(
    id: string | number,
    payload: Partial<Alert>,
  ) {
    const { data } = await api.patch<Alert>(
      `/alerts/${id}`,
      payload,
    );

    return data;
  },

  async resolve(
    id: string | number,
    payload?: { resolution_note?: string },
  ) {
    const { data } = await api.post<Alert>(
      `/alerts/${id}/resolve`,
      payload ?? {},
    );

    return data;
  },
};

/* -------------------------------- incidents ------------------------------- */

export const incidentService = {
  async list(params?: QueryParams): Promise<Paginated<Incident>> {
    const { data } = await api.get("/incidents", {
      params: clean(params),
    });

    return normalizeList<Incident>(
      data,
      Number(params?.["page"] ?? 1),
      Number(params?.["page_size"] ?? 25),
    );
  },

  async get(id: string | number) {
    const { data } = await api.get<Incident>(
      `/incidents/${id}`,
    );

    return data;
  },

  async create(payload: Partial<Incident>) {
    const { data } = await api.post<Incident>(
      "/incidents",
      payload,
    );

    return data;
  },

  async update(
    id: string | number,
    payload: Partial<Incident>,
  ) {
    const { data } = await api.patch<Incident>(
      `/incidents/${id}`,
      payload,
    );

    return data;
  },
};

/* --------------------------------- threats -------------------------------- */

export const threatService = {
  async list(params?: QueryParams): Promise<Paginated<Threat>> {
    const { data } = await api.get("/threats", {
      params: clean(params),
    });

    return normalizeList<Threat>(data);
  },

  async get(id: string | number) {
    const { data } = await api.get<Threat>(
      `/threats/${id}`,
    );

    return data;
  },
};

/* ---------------------------------- mitre --------------------------------- */

export const mitreService = {
  async techniques(
    params?: QueryParams,
  ): Promise<Paginated<MitreTechnique>> {
    const { data } = await api.get("/mitre/techniques", {
      params: clean(params),
    });

    return normalizeList<MitreTechnique>(data);
  },

  async technique(techniqueId: string) {
    const { data } = await api.get<MitreTechnique>(
      `/mitre/${techniqueId}`,
    );

    return data;
  },
};

/* -------------------------------- analytics ------------------------------- */

export const analyticsService = {
  async overview(params?: QueryParams) {
    const { data } = await api.get<AnalyticsOverview>(
      "/analytics/overview",
      {
        params: clean(params),
      },
    );

    return data;
  },

  async attacks(params?: QueryParams) {
    const { data } = await api.get<AnalyticsAttacks>(
      "/analytics/attacks",
      {
        params: clean(params),
      },
    );

    return data;
  },

  async risk(params?: QueryParams) {
    const { data } = await api.get<AnalyticsRisk>(
      "/analytics/risk",
      {
        params: clean(params),
      },
    );

    return data;
  },
};

/* --------------------------------- reports -------------------------------- */

export const reportService = {
  async list(
    params?: QueryParams,
  ): Promise<Paginated<ReportSummary>> {
    const { data } = await api.get("/reports", {
      params: clean(params),
    });

    if (
      data &&
      !Array.isArray(data) &&
      !("items" in (data as object))
    ) {
      // Backend may return a single generated report object.
      return {
        items: [data as ReportSummary],
        total: 1,
        page: 1,
        page_size: 1,
      };
    }

    return normalizeList<ReportSummary>(data);
  },
};

/* ---------------------------------- models -------------------------------- */

export const modelService = {
  async list(): Promise<Paginated<Model>> {
    const { data } = await api.get("/models");

    return normalizeList<Model>(data);
  },

  async get(id: string | number) {
    const { data } = await api.get<Model>(
      `/models/${id}`,
    );

    return data;
  },
};

/* ---------------------------------- users --------------------------------- */

export const userService = {
  async me() {
    const { data } = await api.get<User>("/users/me");

    return data;
  },

  async updateMe(payload: Partial<User>) {
    const { data } = await api.patch<User>(
      "/users/me",
      payload,
    );

    return data;
  },
};

/* ---------------------------------- admin --------------------------------- */

/*
 * NOTE: the shared contract does not yet define admin list endpoints.
 * These two paths are isolated here so they can be re-pointed in one place
 * once the FastAPI team publishes them. The UI degrades to an error/empty
 * state until they exist.
 */

export const ADMIN_USERS_PATH = "/users";
export const ADMIN_AUDIT_LOGS_PATH = "/audit-logs";

export const adminService = {
  async users(
    params?: QueryParams,
  ): Promise<Paginated<User>> {
    const { data } = await api.get(ADMIN_USERS_PATH, {
      params: clean(params),
    });

    return normalizeList<User>(data);
  },

  async auditLogs(
    params?: QueryParams,
  ): Promise<Paginated<AuditLog>> {
    const { data } = await api.get(ADMIN_AUDIT_LOGS_PATH, {
      params: clean(params),
    });

    return normalizeList<AuditLog>(data);
  },

  async systemStatus(): Promise<SystemStatus> {
    const { data } = await api.get<DashboardSummary>(
      "/dashboard/summary",
    );

    return data.system_status ?? {};
  },
};