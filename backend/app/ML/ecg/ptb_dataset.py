"""
PTB Diagnostic Database dataset loader.
Parses .hea files for labels and loads 12-lead ECG at 1000 Hz.
"""

from pathlib import Path
from typing import List, Tuple, Dict
import numpy as np
import wfdb

DESIRED_LEADS = ["i", "ii", "iii", "avr", "avl", "avf", "v1", "v2", "v3", "v4", "v5", "v6"]

# Map PTB "Reason for admission" -> our class_names index
PTB_LABEL_MAP = {
    "healthy control": 0,
    "myocardial infarction": 1,
    "cardiomyopathy": 2,
    "heart failure": 2,
    "cardiomyopathy/heart failure": 2,
    "bundle branch block": 3,
    "dysrhythmia": 4,
    "myocardial hypertrophy": 5,
    "valvular heart disease": 6,
    "myocarditis": 7,
    "n/a": 8,
    "miscellaneous": 8,
}


def parse_ptb_label(hea_path: Path) -> int:
    """Parse 'Reason for admission' from PTB .hea file. Returns class index 0-8."""
    with open(hea_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if "# Reason for admission:" in line or "Reason for admission:" in line:
                label = line.split(":", 1)[-1].strip().lower().strip("# ")
                # Try exact match first
                if label in PTB_LABEL_MAP:
                    return PTB_LABEL_MAP[label]
                # Partial match
                for key, idx in PTB_LABEL_MAP.items():
                    if key in label or label in key:
                        return idx
                return 8  # Miscellaneous
    return 8


def discover_ptb_records(dataset_dir: Path) -> List[Tuple[str, int]]:
    """
    Find all PTB records and their labels.
    Returns [(record_id, class_idx), ...]
    """
    records = []
    for hea_file in sorted(dataset_dir.rglob("*.hea")):
        # Skip .xyz files (we need .dat for 12 leads)
        if hea_file.stem.endswith("_xyz") or ".xyz" in hea_file.name:
            continue
        rel = hea_file.relative_to(dataset_dir)
        record_id = str(rel.with_suffix("")).replace("\\", "/")
        label = parse_ptb_label(hea_file)
        records.append((record_id, label))
    return records


def load_ptb_segment(
    dataset_dir: Path,
    record_id: str,
    start_sec: float = 0.0,
    duration_sec: float = 10.0,
) -> np.ndarray:
    """
    Load 12-lead ECG segment. Returns (12, N) float32 array at 1000 Hz.
    """
    record_path = (dataset_dir / record_id).as_posix()
    rec = wfdb.rdrecord(record_path)
    sig = rec.p_signal.astype(np.float32)
    names = [n.lower() for n in rec.sig_name]
    name_to_idx = {n: i for i, n in enumerate(names)}
    idxs = [name_to_idx[n] for n in DESIRED_LEADS if n in name_to_idx]
    if len(idxs) != 12:
        raise ValueError(f"Missing leads in {record_id}, got {len(idxs)}")
    ecg12 = sig[:, idxs]

    fs = int(rec.fs)
    start = int(start_sec * fs)
    win = int(duration_sec * fs)
    end = start + win

    if end > ecg12.shape[0]:
        pad = end - ecg12.shape[0]
        x = np.pad(ecg12[start:], ((0, pad), (0, 0)), mode="edge")
    else:
        x = ecg12[start:end]

    return x.T  # (12, win)
