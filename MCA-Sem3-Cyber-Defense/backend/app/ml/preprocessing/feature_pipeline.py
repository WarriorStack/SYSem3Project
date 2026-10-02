"""
Shared feature preprocessing pipeline used by BOTH training and inference so
that the exact same transformation logic (imputation, feature ordering,
scaling) is applied in both paths. This avoids train/serve skew.
"""
from typing import Dict, List

import numpy as np
import pandas as pd

# Canonical, fixed feature order. Any change here requires retraining.
FEATURE_ORDER: List[str] = [
    "flow_duration",
    "total_fwd_packets",
    "total_bwd_packets",
    "total_length_fwd_packets",
    "total_length_bwd_packets",
    "flow_bytes_per_s",
    "flow_packets_per_s",
    "packet_length_mean",
    "packet_length_std",
    "syn_flag_count",
    "ack_flag_count",
    "fin_flag_count",
]

DEFAULT_VALUE = 0.0


def raw_features_to_frame(records: List[Dict]) -> pd.DataFrame:
    """
    Convert a list of raw feature dicts (as received from the API) into a
    DataFrame with a fixed, model-expected column order. Missing values are
    imputed with DEFAULT_VALUE; unknown extra fields are dropped.
    """
    rows = []
    for record in records:
        row = {col: record.get(col, DEFAULT_VALUE) for col in FEATURE_ORDER}
        # Coerce to float, guarding against malformed values
        for col in FEATURE_ORDER:
            try:
                row[col] = float(row[col]) if row[col] is not None else DEFAULT_VALUE
            except (TypeError, ValueError):
                row[col] = DEFAULT_VALUE
        rows.append(row)

    df = pd.DataFrame(rows, columns=FEATURE_ORDER)
    df = df.replace([np.inf, -np.inf], np.nan).fillna(DEFAULT_VALUE)
    return df


def dataframe_to_matrix(df: pd.DataFrame) -> np.ndarray:
    return df[FEATURE_ORDER].to_numpy(dtype=float)
