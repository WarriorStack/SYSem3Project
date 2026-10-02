from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.detection import DetectionStatus, SeverityLevel


class NetworkFlowFeatures(BaseModel):
    """
    Normalized network-flow feature payload accepted by the detection pipeline.
    Field set intentionally mirrors common CICFlowMeter / CIC-IDS2017 / UNSW-NB15
    derived attributes. Additional dataset-specific fields are accepted and
    forwarded to the preprocessing service.
    """

    source_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_ip: Optional[str] = None
    destination_port: Optional[int] = None
    protocol: Optional[str] = None

    flow_duration: Optional[float] = None
    total_fwd_packets: Optional[float] = None
    total_bwd_packets: Optional[float] = None
    total_length_fwd_packets: Optional[float] = None
    total_length_bwd_packets: Optional[float] = None
    flow_bytes_per_s: Optional[float] = None
    flow_packets_per_s: Optional[float] = None
    packet_length_mean: Optional[float] = None
    packet_length_std: Optional[float] = None
    syn_flag_count: Optional[float] = None
    ack_flag_count: Optional[float] = None
    fin_flag_count: Optional[float] = None

    # Allow additional dataset-specific numeric/categorical features
    model_config = ConfigDict(extra="allow")


class DetectionAnalyzeRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    dataset: Optional[str] = Field(default="CIC-IDS2017", description="CIC-IDS2017 or UNSW-NB15")
    model_name: Optional[str] = Field(default=None, description="Optional explicit model override")
    features: NetworkFlowFeatures


class DetectionBatchRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    dataset: Optional[str] = Field(default="CIC-IDS2017")
    model_name: Optional[str] = None
    records: List[NetworkFlowFeatures] = Field(..., max_length=1000)


class MitreReference(BaseModel):
    technique_id: str
    name: str
    tactic: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DetectionOut(BaseModel):
    id: int
    timestamp: datetime
    source_ip: Optional[str]
    source_port: Optional[int]
    destination_ip: Optional[str]
    destination_port: Optional[int]
    protocol: Optional[str]
    prediction: str
    attack_type: str
    confidence: float
    severity: SeverityLevel
    risk_score: float
    explanation: Optional[str]
    status: DetectionStatus
    mitre_technique: Optional[MitreReference] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DetectionAnalyzeResponse(BaseModel):
    detection: DetectionOut
    alert_created: bool
    alert_id: Optional[int] = None


class DetectionBatchResponse(BaseModel):
    processed: int
    failed: int
    results: List[DetectionOut]
    errors: List[Dict[str, Any]] = []


class PaginatedDetections(BaseModel):
    items: List[DetectionOut]
    page: int
    page_size: int
    total: int
    total_pages: int
