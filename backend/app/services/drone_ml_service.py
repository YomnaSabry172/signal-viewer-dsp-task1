"""
ML-based drone detection using the drone_detector model.
Integrates predict logic from /drone_detector into the backend.
Expects drone_detector.h5 and labels.npy in the drone_detector folder
(trained via drone_detector/train_model.py).
"""

from pathlib import Path
from typing import Optional, Dict, Any

# Path to drone_detector folder (sibling of backend)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DRONE_DETECTOR_DIR = PROJECT_ROOT / "drone_detector"
MODEL_PATH = DRONE_DETECTOR_DIR / "drone_detector.h5"
LABELS_PATH = DRONE_DETECTOR_DIR / "labels.npy"

_model = None
_labels = None


def _load_model() -> bool:
    """Lazy-load the Keras model and labels."""
    global _model, _labels
    if _model is not None:
        return True
    if not MODEL_PATH.exists() or not LABELS_PATH.exists():
        return False
    try:
        from tensorflow.keras.models import load_model as keras_load_model
        import numpy as np
        _model = keras_load_model(str(MODEL_PATH))
        _labels = np.load(str(LABELS_PATH))
        return True
    except Exception:
        return False


def predict_drone_ml(file_path: str) -> Optional[Dict[str, Any]]:
    """
    Run ML-based drone prediction on an audio file.
    Returns { prediction, confidence } or None if model unavailable.
    """
    if not _load_model():
        return None

    import numpy as np
    import librosa

    SAMPLE_RATE = 22050
    N_MFCC = 40

    try:
        audio, sr = librosa.load(file_path, sr=SAMPLE_RATE)
        max_len = SAMPLE_RATE * 3
        if len(audio) < max_len:
            audio = np.pad(audio, (0, max_len - len(audio)))
        else:
            audio = audio[:max_len]

        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC)
        mfcc_scaled = np.mean(mfcc.T, axis=0)
        features = mfcc_scaled.reshape(1, -1)

        prediction = _model.predict(features)
        class_index = int(np.argmax(prediction))
        confidence = float(np.max(prediction))

        return {
            "prediction": str(_labels[class_index]),
            "confidence": round(confidence, 4),
        }
    except Exception:
        return None


def is_ml_available() -> bool:
    """Check if the ML model is available."""
    return _load_model()
