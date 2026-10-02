"""
Training entry point for the threat-classification models.

IMPORTANT (academic project note):
This script trains on either:
  (a) a real CIC-IDS2017 / UNSW-NB15 CSV supplied via --csv, mapped to the
      canonical FEATURE_ORDER columns, or
  (b) a bundled, clearly-labeled SYNTHETIC dataset generator used only to
      bootstrap a runnable demo when the real dataset files are not present
      in this environment.

Training and inference are kept fully separate: this script is run offline
/ manually, never on a live API request. The inference service only ever
loads the joblib artifact produced here.
"""
import argparse
import os
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

from app.ml.preprocessing.feature_pipeline import FEATURE_ORDER

ATTACK_TYPES = ["benign", "dos", "port_scan", "brute_force", "botnet", "web_attack"]


def generate_synthetic_dataset(n_samples: int = 6000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a structurally realistic (but synthetic) labeled flow dataset,
    used only to bootstrap a working model when real CIC-IDS2017/UNSW-NB15
    CSVs are unavailable. Each class has distinct statistical characteristics
    loosely inspired by published flow-based IDS literature (e.g. DoS having
    very high packet rate, port scans having many short flows with SYN flags,
    brute force having repeated short connections, botnet C2 traffic being
    low-and-slow, web attacks resembling benign but with abnormal payload size).
    """
    rng = np.random.default_rng(random_state)
    n_per_class = n_samples // len(ATTACK_TYPES)
    frames = []

    for label in ATTACK_TYPES:
        if label == "benign":
            duration = rng.normal(500, 150, n_per_class)
            fwd_pkts = rng.normal(20, 8, n_per_class)
            bwd_pkts = rng.normal(18, 7, n_per_class)
            byte_rate = rng.normal(2000, 800, n_per_class)
            pkt_rate = rng.normal(15, 5, n_per_class)
            syn = rng.poisson(1, n_per_class)
            ack = rng.poisson(10, n_per_class)
            fin = rng.poisson(1, n_per_class)
        elif label == "dos":
            duration = rng.normal(50, 20, n_per_class)
            fwd_pkts = rng.normal(500, 150, n_per_class)
            bwd_pkts = rng.normal(5, 3, n_per_class)
            byte_rate = rng.normal(50000, 15000, n_per_class)
            pkt_rate = rng.normal(800, 200, n_per_class)
            syn = rng.poisson(50, n_per_class)
            ack = rng.poisson(2, n_per_class)
            fin = rng.poisson(0, n_per_class)
        elif label == "port_scan":
            duration = rng.normal(5, 2, n_per_class)
            fwd_pkts = rng.normal(2, 1, n_per_class)
            bwd_pkts = rng.normal(1, 1, n_per_class)
            byte_rate = rng.normal(100, 40, n_per_class)
            pkt_rate = rng.normal(50, 20, n_per_class)
            syn = rng.poisson(30, n_per_class)
            ack = rng.poisson(1, n_per_class)
            fin = rng.poisson(0, n_per_class)
        elif label == "brute_force":
            duration = rng.normal(20, 10, n_per_class)
            fwd_pkts = rng.normal(15, 5, n_per_class)
            bwd_pkts = rng.normal(15, 5, n_per_class)
            byte_rate = rng.normal(3000, 1000, n_per_class)
            pkt_rate = rng.normal(120, 30, n_per_class)
            syn = rng.poisson(20, n_per_class)
            ack = rng.poisson(15, n_per_class)
            fin = rng.poisson(3, n_per_class)
        elif label == "botnet":
            duration = rng.normal(3000, 900, n_per_class)
            fwd_pkts = rng.normal(6, 3, n_per_class)
            bwd_pkts = rng.normal(6, 3, n_per_class)
            byte_rate = rng.normal(150, 60, n_per_class)
            pkt_rate = rng.normal(2, 1, n_per_class)
            syn = rng.poisson(2, n_per_class)
            ack = rng.poisson(5, n_per_class)
            fin = rng.poisson(1, n_per_class)
        else:  # web_attack
            duration = rng.normal(600, 200, n_per_class)
            fwd_pkts = rng.normal(25, 10, n_per_class)
            bwd_pkts = rng.normal(20, 8, n_per_class)
            byte_rate = rng.normal(9000, 3000, n_per_class)
            pkt_rate = rng.normal(30, 10, n_per_class)
            syn = rng.poisson(3, n_per_class)
            ack = rng.poisson(12, n_per_class)
            fin = rng.poisson(2, n_per_class)

        pkt_len_mean = rng.normal(400, 150, n_per_class)
        pkt_len_std = np.abs(rng.normal(80, 30, n_per_class))

        df = pd.DataFrame(
            {
                "flow_duration": np.abs(duration),
                "total_fwd_packets": np.abs(fwd_pkts),
                "total_bwd_packets": np.abs(bwd_pkts),
                "total_length_fwd_packets": np.abs(fwd_pkts) * np.abs(pkt_len_mean),
                "total_length_bwd_packets": np.abs(bwd_pkts) * np.abs(pkt_len_mean) * 0.8,
                "flow_bytes_per_s": np.abs(byte_rate),
                "flow_packets_per_s": np.abs(pkt_rate),
                "packet_length_mean": np.abs(pkt_len_mean),
                "packet_length_std": pkt_len_std,
                "syn_flag_count": np.abs(syn),
                "ack_flag_count": np.abs(ack),
                "fin_flag_count": np.abs(fin),
                "label": label,
            }
        )
        frames.append(df)

    full = pd.concat(frames, ignore_index=True)
    return full.sample(frac=1.0, random_state=random_state).reset_index(drop=True)


def load_csv_dataset(csv_path: str, label_column: str = "label") -> pd.DataFrame:
    """Load a real dataset CSV. Caller is responsible for pre-mapping column
    names to FEATURE_ORDER (+ label_column) beforehand for the target dataset
    (CIC-IDS2017 or UNSW-NB15), since their raw schemas differ."""
    df = pd.read_csv(csv_path)
    missing = [c for c in FEATURE_ORDER if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing required columns: {missing}")
    if label_column not in df.columns:
        raise ValueError(f"CSV is missing label column '{label_column}'")
    return df


def build_model(algorithm: str):
    if algorithm == "logistic_regression":
        return LogisticRegression(max_iter=1000, multi_class="auto")
    if algorithm == "random_forest":
        return RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    if algorithm == "xgboost":
        return XGBClassifier(
            n_estimators=250,
            max_depth=6,
            learning_rate=0.1,
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
        )
    raise ValueError(f"Unsupported algorithm: {algorithm}")


def train_and_save(
    algorithm: str = "xgboost",
    output_dir: str = "./app/ml/models",
    csv_path: str = None,
    label_column: str = "label",
) -> dict:
    df = load_csv_dataset(csv_path, label_column) if csv_path else generate_synthetic_dataset()
    label_col = label_column if csv_path else "label"

    X = df[FEATURE_ORDER].to_numpy(dtype=float)
    y_raw = df[label_col].astype(str).to_numpy()

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = build_model(algorithm)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, average="weighted", zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, average="weighted", zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, average="weighted", zero_division=0)),
    }

    os.makedirs(output_dir, exist_ok=True)
    artifact_path = os.path.join(output_dir, f"{algorithm}_threat_classifier.joblib")
    joblib.dump(
        {
            "model": model,
            "scaler": scaler,
            "label_encoder": label_encoder,
            "feature_order": FEATURE_ORDER,
            "algorithm": algorithm,
            "metrics": metrics,
        },
        artifact_path,
    )

    return {"artifact_path": artifact_path, "metrics": metrics}


def _cli() -> None:
    parser = argparse.ArgumentParser(description="Train a threat-classification model")
    parser.add_argument(
        "--algorithm",
        choices=["logistic_regression", "random_forest", "xgboost"],
        default="xgboost",
    )
    parser.add_argument("--output-dir", default="./app/ml/models")
    parser.add_argument("--csv", default=None, help="Path to a pre-mapped CIC-IDS2017/UNSW-NB15 CSV")
    parser.add_argument("--label-column", default="label")
    args = parser.parse_args()

    result = train_and_save(
        algorithm=args.algorithm,
        output_dir=args.output_dir,
        csv_path=args.csv,
        label_column=args.label_column,
    )
    print(f"Saved model to {result['artifact_path']}")
    print(f"Metrics: {result['metrics']}")


if __name__ == "__main__":
    _cli()
