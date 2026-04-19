import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.routers.ecg_router import router as ecg_router
from app.routers.acoustic_router import router as acoustic_router
from app.routers.gold_router import router as gold_router
from app.routers.microbiome_router import router as microbiome_router
from app.services.acoustic_service import load_audio_wav, detect_drone
from app.routers.eeg_router import router as eeg_router


try:
    from app.services.drone_ml_service import predict_drone_ml, is_ml_available
except ImportError:
    predict_drone_ml = None
    is_ml_available = lambda: False

app = FastAPI(title="Signal Viewer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def root():
    return {"message": "backend is working"}

@app.get('/health')
def health():
    return {"status": "OK"}


@app.get("/detect/status")
def detect_status():
    """Check if ML drone detector is available."""
    return {"ml_available": is_ml_available() if predict_drone_ml else False}


@app.post("/detect/")
async def detect_endpoint(file: UploadFile = File(...)):
    """
    Drone detection endpoint. Uses ML model from /drone_detector when available,
    otherwise falls back to DSP-based detection. Returns { prediction, confidence }.
    """
    try:
        if not file.filename or not file.filename.lower().endswith('.wav'):
            return {"prediction": "error", "confidence": 0, "error": "Only WAV files supported"}
        file_data = await file.read()
        if not file_data:
            return {"prediction": "error", "confidence": 0, "error": "Empty file"}

        # Try ML detector first (from drone_detector) when model files exist
        if predict_drone_ml and is_ml_available():
            suffix = Path(file.filename).suffix or ".wav"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(file_data)
                tmp_path = tmp.name
            try:
                result = predict_drone_ml(tmp_path)
                if result:
                    return result
            finally:
                Path(tmp_path).unlink(missing_ok=True)

        # Fallback: DSP-based detection (acoustic_service)
        audio, sample_rate = load_audio_wav(file_data)
        result = detect_drone(audio, sample_rate)
        if not result.get("ok"):
            return {"prediction": "error", "confidence": 0, "error": result.get("error", "Detection failed")}
        return {
            "prediction": "drone" if result["detected"] else "no_drone",
            "confidence": round(result["score"], 2),
        }
    except Exception as e:
        return {"prediction": "error", "confidence": 0, "error": str(e)}


app.include_router(ecg_router, prefix="/ecg", tags=["ECG"])
app.include_router(acoustic_router, prefix="/acoustic", tags=["Acoustic"])
app.include_router(gold_router, prefix="/gold", tags=["Gold"])
app.include_router(microbiome_router, prefix="/microbiome", tags=["Microbiome"])
app.include_router(eeg_router, prefix="/eeg", tags=["EEG"])