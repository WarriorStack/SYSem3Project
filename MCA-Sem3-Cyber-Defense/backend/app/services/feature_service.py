from typing import Dict, List

from app.schemas.detection import NetworkFlowFeatures


def features_to_dict(features: NetworkFlowFeatures) -> Dict:
    return features.model_dump()


def batch_features_to_dicts(records: List[NetworkFlowFeatures]) -> List[Dict]:
    return [features_to_dict(r) for r in records]
