"""
Acoustic Router: Endpoints for Doppler estimation, generation, and drone detection
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from app.services.acoustic_service import load_audio_wav, estimate_doppler, detect_drone, generate_doppler_sound

router = APIRouter()


@router.get("/doppler/generate")
async def generate_doppler_endpoint(
    velocity: float = Query(25.0, ge=0, le=80, description="Vehicle velocity (m/s)"),
    frequency: float = Query(400.0, ge=50, le=2000, description="Horn base frequency (Hz)"),
    duration: float = Query(3.0, ge=1.0, le=10.0, description="Duration (seconds)"),
    sample_rate: int = Query(44100, ge=8000, le=48000, description="Sample rate (Hz)"),
):
    """
    Generate WAV audio of a car passing with Doppler effect.
    Returns a WAV file for download/playback.
    """
    try:
        wav_bytes = generate_doppler_sound(velocity, frequency, duration, sample_rate)
        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f'attachment; filename="doppler_v{velocity}_f{int(frequency)}.wav"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/doppler/estimate")
async def estimate_doppler_endpoint(file: UploadFile = File(..., alias="file")):
    """
    Estimate Doppler shift from a vehicle pass-by recording.
    
    Input:
        file: Audio file (WAV, FLAC, or OGG)
        
    Output JSON:
    {
      "ok": true,
      "fa_hz": 750.5,
      "fr_hz": 650.3,
      "f0_hz": 698.2,
      "v_ms": 25.5,
      "v_kmh": 91.8,
      "debug": {
        "passby_time_s": 1.5,
        "freq_track_hz": [...],
        "times_s": [...]
      }
    }
    """
    try:
        # Check file extension (WAV, FLAC, OGG)
        fn = (file.filename or "").lower()
        if not any(fn.endswith(ext) for ext in ('.wav', '.flac', '.ogg', '.oga')):
            raise HTTPException(status_code=400, detail="Supported formats: WAV, FLAC, OGG")
        
        # Read file bytes
        file_data = await file.read()
        if not file_data:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Load audio
        audio, sample_rate = load_audio_wav(file_data, file.filename)
        
        # Estimate Doppler (runs on backend)
        result = estimate_doppler(audio, sample_rate)
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": str(e)}
        )


@router.post("/drone/detect")
async def detect_drone_endpoint(file: UploadFile = File(...)):
    """
    Detect drone/propeller sounds in audio file.
    
    Input:
        file: WAV audio file (.wav only)
        
    Output JSON:
    {
      "ok": true,
      "detected": true,
      "score": 0.85,
      "features": {
        "band_energy_ratio": 2.5,
        "spectral_centroid": 850.3
      }
    }
    """
    try:
        # Check file extension
        if not file.filename.lower().endswith('.wav'):
            raise HTTPException(status_code=400, detail="Only WAV files are supported")
        
        # Read file bytes
        file_data = await file.read()
        if not file_data:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Load audio
        audio, sample_rate = load_audio_wav(file_data)
        
        # Detect drone
        result = detect_drone(audio, sample_rate)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }
