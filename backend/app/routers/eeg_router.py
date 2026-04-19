import requests
import base64
import io
import numpy as np
from remotezip import RemoteZip
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import traceback
from pathlib import Path
from app.ML.eeg.predictor import predict_with_model

router = APIRouter()
APP_DIR = Path(__file__).resolve().parent.parent

# --- KAGGLE CONNECTION ---
KAG_USER = "yousefsamy"
KAG_KEY = "906e9123bd60a5f081f25334bf57594"
DATASET_URL = "https://www.kaggle.com/api/v1/datasets/download/zyadhamed/eeg-downloaded-dataset"

def get_kaggle_session():
    creds = base64.b64encode(f"{KAG_USER}:{KAG_KEY}".encode()).decode("ascii")
    session = requests.Session()
    resp = session.get(
        DATASET_URL,
        headers={"Authorization": f"Basic {creds}"},
        allow_redirects=True,
        stream=True
    )
    return session, resp.url

def read_sfreq(rz, file_path: str, default: float = 256.0) -> float:
    """Helper: read the companion _sfreq.npy file if it exists."""
    sfreq_path = file_path.replace(".npy", "_sfreq.npy")
    if sfreq_path in rz.namelist():
        with rz.open(sfreq_path) as sf:
            return float(np.load(io.BytesIO(sf.read())))
    return default

# --- AI MODEL SECTION ---
class EEGData(BaseModel):
    eeg_file_path: str
    weights_path: Optional[str] = None
    cfg: dict = {}

@router.post("/predicteeg")
async def predict_eeg(data: EEGData):
    try:
        # 1. Resolve weights path
        absolute_weights_path = APP_DIR / "ML" / "eeg" / "biot_eeg_finetuned.pth"
        if not absolute_weights_path.exists():
            raise FileNotFoundError(f"Missing weights at: {absolute_weights_path}")

        print("\n--- AI PREDICTION DEBUG ---")
        print(f"Weights Path : {absolute_weights_path}")
        print(f"EEG File     : {data.eeg_file_path}")

        # 2. Fetch EEG array AND its sample rate from Kaggle in one connection
        session, final_url = get_kaggle_session()
        with RemoteZip(final_url, session=session) as rz:
            if data.eeg_file_path not in rz.namelist():
                raise FileNotFoundError(
                    f"File '{data.eeg_file_path}' not found in Kaggle dataset."
                )

            # FIX: read the actual sample rate so predictor can resample correctly
            sample_rate = read_sfreq(rz, data.eeg_file_path, default=256.0)
            print(f"Sample Rate  : {sample_rate} Hz")

            with rz.open(data.eeg_file_path) as f:
                eeg_array = np.load(io.BytesIO(f.read()))

        print(f"Array Shape  : {eeg_array.shape}")

        # 3. Pass sfreq to predictor so it can resample to 200Hz
        cfg = {**data.cfg, "sfreq": sample_rate}
        prediction = predict_with_model(eeg_array, str(absolute_weights_path), cfg)

        print("Prediction Successful!")
        return {"predictions": prediction}

    except Exception as e:
        print("\n!!! AI PREDICTION CRASHED !!!")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction Error: {str(e)}")


# --- KAGGLE STREAMING SECTION ---
@router.get("/list-files")
async def list_eeg_files():
    try:
        session, final_url = get_kaggle_session()
        with RemoteZip(final_url, session=session) as rz:
            files = [
                f for f in rz.namelist()
                if f.lower().endswith('.npy') and '_sfreq' not in f
            ]
        return {"files": sorted(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stream")
async def get_eeg_stream(file_path: str = Query(...)):
    try:
        session, final_url = get_kaggle_session()
        with RemoteZip(final_url, session=session) as rz:
            sample_rate = read_sfreq(rz, file_path, default=256.0)

            with rz.open(file_path) as f:
                array_data = np.load(io.BytesIO(f.read()))

        # Ensure shape is (channels, samples)
        if array_data.shape[0] > array_data.shape[1]:
            array_data = array_data.T

        max_points = 2560
        channels = []
        for ch_idx in range(len(array_data)):  # all channels, no cap
            slice_data = array_data[ch_idx][:max_points]
            series = [[i / sample_rate, float(val)] for i, val in enumerate(slice_data)]
            channels.append(series)

        return {
            "label": file_path.split("/")[-1],
            "channels": len(channels),
            "sampleRate": sample_rate,
            "data": channels,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))