from fastapi import APIRouter, HTTPException, Query
import os
from pathlib import Path
from app.core.config import ECG_DATASET_DIR
from app.services.ecg_service import get_available_ecg_records, get_ecg_segment
from app.services.classic_ml_ecg_service import run_classic_ml
from pydantic import BaseModel

router = APIRouter()


class PredictRequest(BaseModel):
    record_id: str
    start: float = 0.0
    seconds: float = 10.0

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "..", "ML", "ecg", "ptb_weights.pt")
LABELS_PATH  = os.path.join(os.path.dirname(__file__), "..", "ML", "ecg" , "labels.json")

# Lazy-loaded predictor to avoid heavy imports at module import time
_predictor = None

def get_predictor():
    global _predictor
    if _predictor is None:
        from app.ML.ecg.predictor import ECGPredictor
        _predictor = ECGPredictor(os.path.abspath(WEIGHTS_PATH), os.path.abspath(LABELS_PATH))
    return _predictor

@router.get("/records")
def list_ecg_records():
    """
    Lists records available in backend/data/ecg/ptbdb
    """
    records = get_available_ecg_records(ECG_DATASET_DIR)
    return {"dataset": "ptbdb", "count": len(records), "records": records}

@router.get("/records/{record_id:path}")
def fetch_ecg_segment(
    record_id: str,
    start: float = Query(0.0, description="Start time (seconds)"),
    seconds: float = Query(5.0, ge=0.1, le=60.0, description="Chunk duration (seconds)"),
    max_points: int = Query(5000, ge=500, le=200000, description="Downsample limit per channel"),
):
    """
    Returns chunk formatted for frontend: data[channel] = [[t,v], ...]
    """
    try:
        return get_ecg_segment(
            ECG_DATASET_DIR,
            record_id=record_id,
            start_time_sec=start,
            duration_sec=seconds,
            max_points_per_channel=max_points,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Record not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/classic-ml")
def classic_ml_ecg(req: PredictRequest):
    """
    Classic ML arrhythmia detection using RR-interval statistics, autocorrelation.. Uses WFDB XQRS for R-peak detection.
    """
    try:
        return run_classic_ml(
            Path(ECG_DATASET_DIR),
            req.record_id,
            start_sec=req.start,
            duration_sec=req.seconds,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Record not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict")
def predict_ecg(req: PredictRequest):
    """
    Endpoint for making predictions on ECG data segments. This endpoint will use the ECGPredictor 
    to analyze the specified segment of the ECG recording and return the predicted class along with 
    confidence scores and relevant metadata.
    """
    record_base = os.path.join(ECG_DATASET_DIR, req.record_id)
    predictor = get_predictor()
    return predictor.predict_window(record_base, start_sec=req.start, seconds=req.seconds)
