from typing import Dict, List

import numpy as np

from app.ml.preprocessing.feature_pipeline import dataframe_to_matrix, raw_features_to_frame


def preprocess_records(records: List[Dict]) -> np.ndarray:
    """
    Applies missing-value handling, feature ordering, and type coercion using
    the same pipeline the model was trained with, returning a numpy matrix
    ready for scaling + inference.
    """
    df = raw_features_to_frame(records)
    return dataframe_to_matrix(df)
