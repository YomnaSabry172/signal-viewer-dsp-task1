from __future__ import annotations
from pathlib import Path
from typing import List, Tuple, Dict, Any
import numpy as np
import wfdb


def discover_wfdb_records(root_dir: Path) -> List[str]:
    """
    Finds WFDB records by scanning for .hea files and returning record IDs.
    Example: root/patient001/s0010_re.hea -> record_id = "patient001/s0010_re"
    """
    if not root_dir.exists():
        return []

    records: List[str] = []
    for hea_file in root_dir.rglob("*.hea"):
        rel = hea_file.relative_to(root_dir)
        record_id = str(rel.with_suffix("")).replace("\\", "/")
        records.append(record_id)

    records.sort()
    return records


def read_wfdb_segment(
    root_dir: Path,
    record_id: str,
    start_time_sec: float,
    duration_sec: float,
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Reads a segment of a WFDB record.
    Returns:
      signals: shape (N, C)
      info: dict including fs, sig_names, etc.
    """
    record_path = (root_dir / record_id).as_posix()

    header = wfdb.rdheader(record_path)
    fs = float(header.fs)
    sig_names = list(header.sig_name) if header.sig_name else []
    n_channels = int(header.n_sig)

    samp_from = int(max(0, np.floor(start_time_sec * fs)))
    samp_to = int(np.floor((start_time_sec + duration_sec) * fs))
    if samp_to <= samp_from:
        samp_to = samp_from + int(fs)  # at least 1 second

    signals, fields = wfdb.rdsamp(record_path, sampfrom=samp_from, sampto=samp_to)

    info = {
        "fs": fs,
        "sig_names": sig_names,
        "channels": n_channels,
        "samp_from": samp_from,
        "samp_to": samp_to,
    }
    return signals, info


def downsample_to_max_points(times: np.ndarray, values: np.ndarray, max_points: int) -> list[list[float]]:
    """
    Convert arrays -> list[[t,v],...] and downsample uniformly to max_points.
    """
    n = len(values)
    if n == 0:
        return []

    if n <= max_points:
        return [[float(t), float(v)] for t, v in zip(times, values)]

    step = int(np.ceil(n / max_points))
    idx = np.arange(0, n, step)
    return [[float(times[i]), float(values[i])] for i in idx]