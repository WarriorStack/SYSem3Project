"""
Loads a trained model artifact (produced by app.ml.training.train_model)
and exposes a simple predict() interface. Models are loaded once and cached
in-process; training never happens on the request path.
"""
import os
import threading
from typing import Dict, Optional

import joblib
import numpy as np

_lock = threading.Lock()
_cache: Dict[str, dict] = {}


class ModelUnavailableError(Exception):
    pass


def _artifact_path(model_dir: str, model_name: str) -> str:
    return os.path.join(model_dir, f"{model_name}.joblib")


def load_artifact(model_dir: str, model_name: str) -> dict:
    key = f"{model_dir}:{model_name}"
    if key in _cache:
        return _cache[key]

    with _lock:
        if key in _cache:
            return _cache[key]
        path = _artifact_path(model_dir, model_name)
        if not os.path.exists(path):
            raise ModelUnavailableError(
                f"Model artifact not found at {path}. Train it first with "
                f"`python -m app.ml.training.train_model --algorithm ...`"
            )
        artifact = joblib.load(path)
        _cache[key] = artifact
        return artifact


class Prediction:
    def __init__(self, label: str, confidence: float, class_probabilities: Dict[str, float],
                 feature_importances: Optional[Dict[str, float]]):
        self.label = label
        self.confidence = confidence
        self.class_probabilities = class_probabilities
        self.feature_importances = feature_importances


def predict(model_dir: str, model_name: str, feature_matrix: np.ndarray) -> "list[Prediction]":
    artifact = load_artifact(model_dir, model_name)
    model = artifact["model"]
    scaler = artifact["scaler"]
    label_encoder = artifact["label_encoder"]
    feature_order = artifact["feature_order"]

    X_scaled = scaler.transform(feature_matrix)
    probabilities = model.predict_proba(X_scaled)
    predicted_indices = np.argmax(probabilities, axis=1)
    labels = label_encoder.inverse_transform(predicted_indices)

    # Genuine feature importances from the model, when available (tree models).
    feature_importances = None
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feature_importances = {
            feature_order[i]: float(importances[i]) for i in range(len(feature_order))
        }

    results = []
    for row_idx in range(feature_matrix.shape[0]):
        class_probs = {
            label_encoder.inverse_transform([i])[0]: float(probabilities[row_idx][i])
            for i in range(probabilities.shape[1])
        }
        results.append(
            Prediction(
                label=str(labels[row_idx]),
                confidence=float(probabilities[row_idx][predicted_indices[row_idx]]),
                class_probabilities=class_probs,
                feature_importances=feature_importances,
            )
        )
    return results
