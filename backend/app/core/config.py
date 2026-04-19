from pathlib import Path
import os

# backend/app/core/config.py
BASE_DIR = Path(__file__).resolve().parents[2]  # -> backend/
DATA_DIR = BASE_DIR / "data"

# ECG datasets
ECG_DATASET_DIR = DATA_DIR / "ecg" / "ptbdb"

# Full PTB Diagnostic for training (override with env PTB_FULL_DATASET_DIR)
PTB_FULL_DATASET_DIR = Path(
    os.environ.get("PTB_FULL_DATASET_DIR", "C:/Users/PC/Downloads/ptb-diagnostic-ecg-database-1.0.0/ptb-diagnostic-ecg-database-1.0.0")
)

# Microbiome datasets: folder containing patients_csv/*.csv (one CSV per patient)
_microbiome_candidates = [
    DATA_DIR / "Microbiome",
    Path.cwd() / "data" / "Microbiome",
    Path.cwd() / "backend" / "data" / "Microbiome",
]
def _has_microbiome_data(p: Path) -> bool:
    patients_dir = p / "patients_csv"
    return patients_dir.is_dir() and any(patients_dir.glob("*.csv"))
MICROBIOME_DATA_DIR = next((p for p in _microbiome_candidates if _has_microbiome_data(p)), DATA_DIR / "Microbiome")