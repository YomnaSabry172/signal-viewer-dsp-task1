from __future__ import annotations

from typing import List, Dict, Any
from pathlib import Path
import json
import numpy as np

from app.services.wfdb_loader import (
    read_wfdb_segment,
    downsample_to_max_points,
)
from app.ML.ecg.ptb_dataset import discover_ptb_records

# Labels path relative to backend/app
_LABELS_PATH = Path(__file__).resolve().parents[1] / "ML" / "ecg" / "labels.json"


def get_available_ecg_records(dataset_dir: Path) -> List[Dict[str, Any]]:
    """
    Returns a list of ECG records the frontend can show.
    Uses PTB dataset discovery to include diagnosis labels.
    """
    ptb_records = discover_ptb_records(dataset_dir)
    class_names: List[str] = []
    if _LABELS_PATH.exists():
        with open(_LABELS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            class_names = data.get("class_names", [])

    result = []
    for record_id, label_idx in ptb_records:
        diagnosis = class_names[label_idx] if 0 <= label_idx < len(class_names) else "Unknown"
        result.append({
            "id": record_id,
            "label": record_id,
            "diagnosis": diagnosis,
            "diagnosis_idx": label_idx,
        })
    return result


def get_ecg_segment(
    dataset_dir: Path,
    record_id: str,
    start_time_sec: float,
    duration_sec: float,
    max_points_per_channel: int = 5000,
) -> Dict[str, Any]:
    """
    Returns an ECG chunk formatted for your frontend viewers:
      data = [ channel0[[t,v],...], channel1[[t,v],...], ... ]
    """
    signals, info = read_wfdb_segment(dataset_dir, record_id, start_time_sec, duration_sec)

    fs = info["fs"]
    samp_from = info["samp_from"]
    sig_names = info["sig_names"]

    if signals is None or len(signals) == 0:
        return {
            "id": record_id,
            "label": record_id,
            "type": "ecg",
            "sampleRate": fs,
            "channels": info["channels"],
            "signalNames": sig_names,
            "start": float(start_time_sec),
            "seconds": float(duration_sec),
            "data": [[] for _ in range(info["channels"])],
        }

    n = signals.shape[0]
    times = (np.arange(n) + samp_from) / fs

    data = []
    for ch in range(signals.shape[1]):
        data.append(downsample_to_max_points(times, signals[:, ch], max_points_per_channel))

    return {
        "id": record_id,
        "label": record_id,
        "type": "ecg",
        "sampleRate": fs,
        "channels": int(signals.shape[1]),
        "signalNames": sig_names,
        "start": float(start_time_sec),
        "seconds": float(duration_sec),
        "data": data,
    }