from typing import Dict, List, Optional

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_detections: int
    active_alerts: int
    critical_alerts: int
    high_alerts: int
    active_incidents: int
    average_risk_score: float
    highest_risk_score: float


class TrendPoint(BaseModel):
    date: str
    count: int
    average_risk_score: float


class DashboardTrends(BaseModel):
    points: List[TrendPoint]


class AttackDistributionItem(BaseModel):
    attack_type: str
    count: int
    percentage: float


class DashboardAttackDistribution(BaseModel):
    items: List[AttackDistributionItem]


class AnalyticsOverview(BaseModel):
    total_detections: int
    total_alerts: int
    total_incidents: int
    malicious_ratio: float
    average_confidence: float
    average_risk_score: float


class AttackFrequencyItem(BaseModel):
    attack_type: str
    count: int


class AnalyticsAttacks(BaseModel):
    frequency: List[AttackFrequencyItem]
    severity_distribution: Dict[str, int]


class RiskTrendPoint(BaseModel):
    date: str
    average_risk_score: float
    max_risk_score: float


class AnalyticsRisk(BaseModel):
    trend: List[RiskTrendPoint]
    current_average_risk: float


class ReportFilters(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    severity: Optional[str] = None
    attack_type: Optional[str] = None


class ReportResponse(BaseModel):
    generated_at: str
    filters: ReportFilters
    total_detections: int
    total_alerts: int
    total_incidents: int
    severity_breakdown: Dict[str, int]
    attack_type_breakdown: Dict[str, int]
    average_risk_score: float
