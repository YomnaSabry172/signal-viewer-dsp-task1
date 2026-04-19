"""
Classic ML Arrhythmia Detection (RR-interval statistics + autocorrelation).

Uses WFDB XQRS for R-peak detection, then classifies rhythm via:
- Basic statistics: mean RR, std, coefficient of variation (CV)
- Successive differences: RMSSD, pNN50, pRR31
- Autocorrelation of RR intervals (regularity)
- Poincaré plot: SD1, SD2 (when enough points)

Refs: pRRx parameters for AF detection; HRV time-domain measures.
"""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import wfdb
from wfdb.processing import XQRS


LEAD_II_IDX = 1  # Lead II for QRS detection
LEAD_I_IDX = 0


def detect_qrs(signal: np.ndarray, fs: float, lead_name: str = "ii") -> np.ndarray:
    """Detect R-peaks using WFDB XQRS. Returns peak indices (samples)."""
    sig_1d = np.asarray(signal, dtype=np.float64).flatten()
    # Normalize: XQRS needs reasonable amplitude (PTB signals are in mV, very small)
    mean_s = np.mean(sig_1d)
    std_s = np.std(sig_1d)
    if std_s > 1e-9:
        sig_1d = (sig_1d - mean_s) / std_s
    xqrs = XQRS(sig=sig_1d, fs=fs)
    xqrs.detect()
    if len(xqrs.qrs_inds) == 0:
        # Fallback: gqrs_detect
        from wfdb.processing import gqrs_detect
        peaks = gqrs_detect(sig_1d, fs)
        return np.array(peaks, dtype=np.int64)
    return np.array(xqrs.qrs_inds, dtype=np.int64)


def rr_intervals(peaks: np.ndarray, fs: float) -> np.ndarray:
    """Compute RR intervals in milliseconds."""
    if len(peaks) < 2:
        return np.array([])
    rr_ms = np.diff(peaks) / fs * 1000
    return rr_ms


def autocorrelation(x: np.ndarray, max_lag: int | None = None) -> np.ndarray:
    """Normalized autocorrelation (lag 0 = 1)."""
    n = len(x)
    if n < 2:
        return np.array([1.0])
    mean_x = np.mean(x)
    xc = x - mean_x
    max_lag = min(max_lag or n - 1, n - 1)
    ac = np.zeros(max_lag + 1)
    c0 = np.sum(xc ** 2)
    if c0 < 1e-12:
        return np.ones(max_lag + 1)
    for lag in range(max_lag + 1):
        ac[lag] = np.sum(xc[: n - lag] * xc[lag:]) / (n - lag)
    return ac / ac[0]


def poincare_sd1_sd2(rr: np.ndarray) -> tuple[float, float]:
    """Poincaré plot SD1 and SD2 from successive RR intervals."""
    if len(rr) < 3:
        return 0.0, 0.0
    rr_n = rr[:-1]
    rr_n1 = rr[1:]
    sd1 = np.std(rr_n1 - rr_n) / np.sqrt(2)
    sd2 = np.std(rr_n1 + rr_n) / np.sqrt(2)
    return float(sd1), float(sd2)


def classify_rhythm(
    rr: np.ndarray,
    mean_rr: float,
    heart_rate: float,
    std_rr: float,
    cv: float,
    rmssd: float,
    pnn50: float,
    prr31: float,
    ac1: float,
    sd1: float,
    sd2: float,
) -> tuple[str, float]:
    """
    Rule-based classification using statistics and autocorrelation.
    Returns (result, confidence).
    """
    n = len(rr)
    if n < 2:
        return "insufficient_data", 0.0

    # Bradycardia / tachycardia (rate-based)
    if heart_rate < 50:
        return "bradycardia", 0.85
    if heart_rate > 120:
        return "tachycardia", 0.8

    if n < 6:
        return "normal", 0.7

    # Strong regularity indicators override noisy autocorrelation
    if cv < 0.12 and pnn50 < 0.2:
        return "normal", 0.9

    # High variability suggests irregularity
    if cv > 0.2 or pnn50 > 0.4:
        return "irregular rhythm", 0.75

    # Low autocorrelation (with enough points) suggests irregularity
    if n >= 8 and ac1 < 0.2:
        return "irregular rhythm", 0.75

    # Atrial fibrillation: high successive variability (pNN50, pRR31)
    if pnn50 > 0.5 or (prr31 > 0.7 and cv > 0.25):
        return "atrial_fibrillation", 0.75

    return "normal", 0.9


def run_classic_ml(
    dataset_dir: Path,
    record_id: str,
    start_sec: float = 0.0,
    duration_sec: float = 10.0,
) -> Dict[str, Any]:
    """
    Run classic ML arrhythmia detection on an ECG segment.
    """
    record_path = (dataset_dir / record_id).as_posix()
    header = wfdb.rdheader(record_path)
    fs = float(header.fs)
    samp_from = int(start_sec * fs)
    samp_to = int((start_sec + duration_sec) * fs)

    signals, _ = wfdb.rdsamp(record_path, sampfrom=samp_from, sampto=samp_to)

    # Use Lead II; fallback to Lead I
    sig_names = [str(s).lower() for s in (header.sig_name or [])]
    lead2_idx = next((i for i, n in enumerate(sig_names) if n == "ii"), LEAD_II_IDX)
    lead2_idx = min(lead2_idx, signals.shape[1] - 1)
    signal = signals[:, lead2_idx].astype(np.float64)

    peaks = detect_qrs(signal, fs)
    rr = rr_intervals(peaks, fs)

    if len(rr) < 1:
        return {
            "result": "insufficient_data",
            "heartRate": None,
            "peakCount": len(peaks),
            "method": "Classic ML (XQRS + RR statistics, autocorrelation, pNN50)",
            "features": {},
        }

    mean_rr = float(np.mean(rr))
    heart_rate = 60000.0 / mean_rr
    std_rr = float(np.std(rr))
    cv = std_rr / mean_rr if mean_rr > 0 else 0

    # Successive differences
    diff_rr = np.diff(rr)
    rmssd = float(np.sqrt(np.mean(diff_rr ** 2))) if len(diff_rr) > 0 else 0
    pnn50 = float(np.mean(np.abs(diff_rr) > 50)) if len(diff_rr) > 0 else 0
    prr31 = float(np.mean(np.abs(diff_rr) > 31)) if len(diff_rr) > 0 else 0

    ac = autocorrelation(rr, max_lag=2)
    ac1 = float(ac[1]) if len(ac) > 1 else 1.0

    sd1, sd2 = poincare_sd1_sd2(rr)

    result, confidence = classify_rhythm(
        rr, mean_rr, heart_rate, std_rr, cv, rmssd, pnn50, prr31, ac1, sd1, sd2
    )

    return {
        "result": result,
        "heartRate": round(heart_rate, 1),
        "peakCount": len(peaks),
        "confidence": confidence,
        "method": "Classic ML (XQRS + RR statistics, autocorrelation, pNN50)",
        "features": {
            "meanRR_ms": round(mean_rr, 1),
            "stdRR_ms": round(std_rr, 1),
            "cv": round(cv, 4),
            "rmssd_ms": round(rmssd, 1),
            "pNN50": round(pnn50 * 100, 1),
            "pRR31": round(prr31 * 100, 1),
            "autocorr_lag1": round(ac1, 3),
            "sd1_ms": round(sd1, 1),
            "sd2_ms": round(sd2, 1),
        },
    }
