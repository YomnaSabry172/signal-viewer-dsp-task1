"""
Acoustic Signal Processing Service
Handles Doppler estimation, Doppler sound generation, and drone detection using classic DSP methods.
"""

import numpy as np
from scipy.io import wavfile
from scipy.signal import stft
from typing import Tuple, Dict, List, Any
import io

# Constants
SOUND_SPEED = 343  # m/s (at ~20°C)


def generate_doppler_sound(
    velocity: float,
    frequency: float,
    duration: float = 3.0,
    sample_rate: int = 44100,
) -> bytes:
    """
    Generate the expected sound of a car passing through you.
    Uses continuous Doppler: f' = f * c / (c - v_r) with smooth v_r(t) as vehicle passes.

    Args:
        velocity: Vehicle speed in m/s (positive)
        frequency: Horn base frequency in Hz
        duration: Sound duration in seconds
        sample_rate: Sample rate in Hz

    Returns:
        WAV file bytes (16-bit mono)
    """
    velocity = max(0, min(float(velocity), 80))  # Clamp 0–80 m/s
    frequency = max(50, min(float(frequency), 2000))  # Clamp 50–2000 Hz

    samples = int(duration * sample_rate)
    t = np.arange(samples, dtype=np.float64) / sample_rate
    pass_time = duration / 2
    tau = duration * 0.15  # smoothness of freq transition at pass-by

    # Radial velocity toward listener: smooth from +v (approach) to -v (recede)
    dt = t - pass_time
    v_radial = velocity * dt / np.sqrt(dt ** 2 + tau ** 2)
    freq_inst = frequency * SOUND_SPEED / (SOUND_SPEED - v_radial)

    # Phase accumulation for FM
    phase = np.zeros(samples + 1)
    phase[0] = 0
    for i in range(samples):
        phase[i + 1] = phase[i] + 2 * np.pi * freq_inst[i] / sample_rate
    phase = phase[:-1]

    # Gaussian envelope centered at pass-by
    envelope = np.exp(-((t - pass_time) ** 2) * 4)
    audio = 0.4 * envelope * np.sin(phase)

    # Crop to last zero-crossing so we end at ~0
    search_len = min(int(0.2 * sample_rate), samples - 1)
    cut_index = samples
    for i in range(samples - 1, max(0, samples - search_len), -1):
        if audio[i - 1] * audio[i] <= 0:
            cut_index = i + 1 if abs(audio[i]) < abs(audio[i - 1]) else i
            break
    audio = audio[:cut_index]

    # Fade-in at start (5ms) — prevents click when DAC starts
    fade_in = min(int(0.005 * sample_rate), len(audio))
    audio[:fade_in] *= np.linspace(0, 1, fade_in)

    # Append 150ms of silence — buffer ends at zero, prevents DAC click
    silence_len = int(0.15 * sample_rate)
    audio = np.concatenate([audio, np.zeros(silence_len)])

    # Convert to int16
    audio_int = np.clip(audio * 32767, -32768, 32767).astype(np.int16)

    buf = io.BytesIO()
    wavfile.write(buf, sample_rate, audio_int)
    return buf.getvalue()


MIN_DOPPLER_FREQ = 50  # Hz
MAX_DOPPLER_FREQ = 3000  # Hz
DRONE_LOW_BAND = (80, 300)  # Hz
DRONE_MID_BAND = (300, 1000)  # Hz
DRONE_HIGH_BAND = (1000, 4000)  # Hz
DRONE_DETECTION_THRESHOLD = 1.5  # band energy ratio threshold


def load_audio_wav(file_data: bytes, filename: str = "") -> Tuple[np.ndarray, int]:
    """
    Load audio from file bytes. Supports WAV, FLAC, OGG via soundfile.
    
    Args:
        file_data: Raw bytes from uploaded file
        filename: Optional filename for format detection
        
    Returns:
        (audio_array, sample_rate)
        - audio_array: float32 array, mono (if stereo, converted to mono)
        - sample_rate: int, samples per second
    """
    try:
        import soundfile as sf
        audio, sample_rate = sf.read(io.BytesIO(file_data), dtype='float32')
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        return audio, sample_rate
    except Exception:
        pass
    try:
        sample_rate, audio_int = wavfile.read(io.BytesIO(file_data))
        if audio_int.dtype == np.int16:
            audio = audio_int.astype(np.float32) / 32768.0
        elif audio_int.dtype == np.int32:
            audio = audio_int.astype(np.float32) / 2147483648.0
        else:
            audio = audio_int.astype(np.float32)
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        return audio, sample_rate
    except Exception as e:
        raise ValueError(f"Failed to load audio file: {str(e)}. Supported: WAV, FLAC, OGG.")


def _parabolic_peak_interp(y: np.ndarray, peak_idx: int) -> float:
    """Sub-bin peak interpolation (JOS formula): p = 0.5*(α-γ)/(α-2β+γ)."""
    if peak_idx <= 0 or peak_idx >= len(y) - 1:
        return float(peak_idx)
    alpha, beta, gamma = y[peak_idx - 1], y[peak_idx], y[peak_idx + 1]
    denom = alpha - 2 * beta + gamma
    if abs(denom) < 1e-12:
        return float(peak_idx)
    offset = 0.5 * (alpha - gamma) / denom
    return peak_idx + np.clip(offset, -0.5, 0.5)


def estimate_doppler(audio: np.ndarray, sample_rate: int) -> Dict[str, Any]:
    """
    Estimate Doppler shift from a passing vehicle's horn sound.
    Uses STFT + parabolic peak interpolation + pass-by detection.
    Matches the generation model: fa = f0*c/(c-v), fr = f0*c/(c+v).
    """
    try:
        if len(audio) < sample_rate:
            return {
                "ok": False,
                "error": "Audio too short (need at least 1 second)"
            }
        
        # STFT: use 8192 for ~5.4 Hz resolution at 44.1k (better for Doppler estimation)
        # Gaussian window: parabolic interpolation is exact for Gaussian (JOS)
        window_len = 8192
        hop_len = 512
        window = ('gaussian', window_len / 6)  # sigma = N/6
        f, t, Zxx = stft(audio, fs=sample_rate, window=window, nperseg=window_len, noverlap=window_len-hop_len)
        magnitude = np.abs(Zxx)
        
        freq_band_mask = (f >= MIN_DOPPLER_FREQ) & (f <= MAX_DOPPLER_FREQ)
        freq_bins = np.where(freq_band_mask)[0]
        df = float(f[1] - f[0]) if len(f) > 1 else sample_rate / window_len
        f0_band = float(f[freq_bins[0]])
        
        if len(freq_bins) < 3:
            return {"ok": False, "error": "No signal in frequency band"}
        
        freq_track_hz = []
        mag_track = []  # magnitude at peak, for weighting
        for frame_idx in range(magnitude.shape[1]):
            spec = magnitude[:, frame_idx]
            spec_band = spec[freq_band_mask]
            if np.max(spec_band) > 0:
                peak_idx = np.argmax(spec_band)
                peak_sub = _parabolic_peak_interp(spec_band, peak_idx)
                peak_freq = f0_band + peak_sub * df
                freq_track_hz.append(peak_freq)
                mag_track.append(float(spec_band[peak_idx]))
            else:
                freq_track_hz.append(0)
                mag_track.append(0)
        
        freq_track_hz = np.array(freq_track_hz)
        mag_track = np.array(mag_track)
        n_frames = len(freq_track_hz)
        
        # Use time-based split: first 35% = approach, last 35% = recede
        # This avoids the transition region and works for symmetric synthetic (pass-by at 50%)
        n_approach = max(2, int(n_frames * 0.35))
        n_recede = max(2, int(n_frames * 0.35))
        
        approach_freqs = freq_track_hz[:n_approach]
        recede_freqs = freq_track_hz[-n_recede:]
        
        passby_time_s = float(t[n_frames // 2])
        
        approach_freqs = approach_freqs[approach_freqs > MIN_DOPPLER_FREQ]
        recede_freqs = recede_freqs[recede_freqs > MIN_DOPPLER_FREQ]
        
        if len(approach_freqs) < 2 or len(recede_freqs) < 2:
            return {
                "ok": False,
                "error": "Insufficient approach or recede phase detected"
            }
        
        # Magnitude-weighted mean for approach/recede (stronger frames = more reliable)
        approach_f = freq_track_hz[:n_approach]
        approach_m = mag_track[:n_approach]
        recede_f = freq_track_hz[-n_recede:]
        recede_m = mag_track[-n_recede:]
        
        def weighted_mean(freqs, mags):
            valid = (freqs > MIN_DOPPLER_FREQ) & (mags > 0)
            if np.sum(valid) < 2:
                return float(np.median(freqs[freqs > MIN_DOPPLER_FREQ])) if np.any(freqs > MIN_DOPPLER_FREQ) else 0
            f, m = freqs[valid], mags[valid]
            return float(np.average(f, weights=m))
        
        fa_hz = weighted_mean(approach_f, approach_m)
        fr_hz = weighted_mean(recede_f, recede_m)
        
        # Approaching = higher freq; ensure correct order
        if fa_hz < fr_hz:
            fa_hz, fr_hz = fr_hz, fa_hz
        
        if fa_hz <= 0 or fr_hz <= 0:
            return {"ok": False, "error": "Invalid frequency estimates"}
        
        if abs(fa_hz / fr_hz - 1) < 0.03:
            return {
                "ok": False,
                "error": "Frequency difference too small; may not be a valid pass-by"
            }
        
        # v = c * (fa - fr) / (fa + fr),  f0 = 2*fa*fr / (fa + fr)
        v_ms = SOUND_SPEED * (fa_hz - fr_hz) / (fa_hz + fr_hz)
        f0_hz = (2 * fa_hz * fr_hz) / (fa_hz + fr_hz)
        
        v_ms = max(0, min(float(v_ms), 100))
        v_kmh = v_ms * 3.6
        
        return {
            "ok": True,
            "fa_hz": round(fa_hz, 1),
            "fr_hz": round(fr_hz, 1),
            "f0_hz": round(f0_hz, 1),
            "v_ms": round(v_ms, 2),
            "v_kmh": round(v_kmh, 2),
            "debug": {
                "passby_time_s": round(passby_time_s, 3),
                "freq_track_hz": [round(float(x), 1) for x in freq_track_hz],
                "times_s": [round(float(x), 3) for x in t]
            }
        }
        
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }


def detect_drone(audio: np.ndarray, sample_rate: int) -> Dict[str, Any]:
    """
    Detect drone/propeller sounds in audio using spectral features.
    Uses band energy ratio and spectral centroid.
    
    Args:
        audio: float32 audio array
        sample_rate: sample rate in Hz
        
    Returns:
        Dictionary with:
        - ok: bool
        - detected: bool (drone present)
        - score: float (0.0 to 1.0)
        - features: { band_energy_ratio, spectral_centroid }
        - error: str (if ok=False)
    """
    try:
        if len(audio) < sample_rate // 2:
            return {
                "ok": False,
                "error": "Audio too short"
            }
        
        # STFT parameters
        window_len = 2048
        hop_len = 512
        
        # Compute STFT
        f, t, Zxx = stft(audio, fs=sample_rate, window='hann', nperseg=window_len, noverlap=window_len-hop_len)
        
        # Magnitude spectrum (average across time)
        magnitude = np.abs(Zxx)
        avg_spectrum = np.mean(magnitude, axis=1)
        
        # Compute band energies
        low_mask = (f >= DRONE_LOW_BAND[0]) & (f <= DRONE_LOW_BAND[1])
        mid_mask = (f >= DRONE_MID_BAND[0]) & (f <= DRONE_MID_BAND[1])
        high_mask = (f >= DRONE_HIGH_BAND[0]) & (f <= DRONE_HIGH_BAND[1])
        
        energy_low = np.sum(avg_spectrum[low_mask]) if np.any(low_mask) else 1e-9
        energy_mid = np.sum(avg_spectrum[mid_mask]) if np.any(mid_mask) else 0
        energy_high = np.sum(avg_spectrum[high_mask]) if np.any(high_mask) else 0
        
        # Band energy ratio (higher mid+high over low indicates drone)
        band_energy_ratio = (energy_mid + energy_high) / (energy_low + 1e-9)
        
        # Spectral centroid
        total_energy = np.sum(avg_spectrum)
        if total_energy > 0:
            spectral_centroid = np.sum(f * avg_spectrum) / total_energy
        else:
            spectral_centroid = 0
        
        # Decision logic: drone detected if high mid/high energy ratio
        # Typical drones: 80-4000 Hz with emphasis on 300-1000 Hz
        detected = band_energy_ratio > DRONE_DETECTION_THRESHOLD
        
        # Score: normalize ratio (0 to 1)
        score = min(1.0, band_energy_ratio / (DRONE_DETECTION_THRESHOLD * 1.5))
        
        return {
            "ok": True,
            "detected": detected,
            "score": round(score, 3),
            "features": {
                "band_energy_ratio": round(band_energy_ratio, 3),
                "spectral_centroid": round(spectral_centroid, 1)
            }
        }
        
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }
