# Signal Viewer – Project Structure

Visual guide to the codebase layout and naming conventions.

## High-Level Overview

```
task01-signal-viewer-sbeg205_spring26_team16/
├── backend/                 # FastAPI REST API & ML services
├── frontend/                 # Next.js React application
├── drone_detector/           # Standalone drone ML model (Keras/TensorFlow)
├── docs/                     # Documentation
└── README.md
```

---

## Backend Structure

```
backend/
├── app/
│   ├── main.py               # FastAPI app, CORS, route registration
│   ├── core/
│   │   └── config.py         # Paths, ECG_DATASET_DIR, PTB_FULL_DATASET_DIR
│   │
│   ├── routers/              # API endpoints by domain
│   │   ├── ecg_router.py     # /ecg/* (records, predict, classic-ml)
│   │   ├── acoustic_router.py # /acoustic/* (doppler, drones)
│   │   ├── eeg_router.py     # /eeg/*
│   │   └── gold_router.py   # /gold/*
│   │
│   ├── services/             # Business logic & signal processing
│   │   ├── ecg_service.py           # ECG record listing, segment fetch
│   │   ├── classic_ml_ecg_service.py # RR stats + autocorrelation (arrhythmia)
│   │   ├── acoustic_service.py      # Doppler, drone DSP
│   │   ├── drone_ml_service.py      # Drone CNN inference
│   │   ├── wfdb_loader.py           # WFDB record loading
│   │   └── gold_service.py
│   │
│   └── ML/                   # ML models (ECG, EEG) — domain-specific predictors
│       ├── ecg/
│       │   ├── model.py       # PTBCNN architecture
│       │   ├── predictor.py   # Inference on 12-lead ECG
│       │   ├── ptb_dataset.py # PTB data loader
│       │   ├── train_ptb.py   # Training script
│       │   ├── labels.json    # Class names
│       │   ├── ptb_weights.pt # Trained weights
│       │   └── splits.json    # Train/val/test split
│       └── eeg/
│           ├── model.py
│           └── predictor.py
│
├── data/                     # Datasets
│   ├── ecg/ptbdb/            # PTB Diagnostic ECG records
│   ├── currency/
│   ├── minerals/
│   └── stock/
│
└── requirements.txt
```

---

## Frontend Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.js
│   ├── api/                  # API routes
│   └── (components)/(contentlayout)/   # Route groups (no URL segment)
│       ├── layout.js         # Content layout wrapper
│       ├── page.js           # Overview
│       └── signal-viewer/
│           ├── page.js       # Signal viewer hub
│           ├── medical/
│           │   ├── ecg/page.js   # ECG Viewer
│           │   └── eeg/page.js   # EEG Viewer
│           ├── acoustic/
│           │   ├── doppler/page.js   # Vehicle Doppler
│           │   └── drones/page.js    # Drone Detection
│           ├── trading/
│           │   ├── stocks/page.js
│           │   ├── currencies/page.js
│           │   └── minerals/page.js
│           └── microbiome/page.js
│
├── shared/                   # Shared code (@/shared)
│   ├── components/
│   │   └── signal-viewer/    # ECG/EEG viewers
│   │       ├── ContinuousViewer.js
│   │       ├── XORViewer.js
│   │       ├── PolarViewer.js
│   │       └── RecurrenceViewer.js
│   ├── data/
│   │   ├── signal-viewer/    # Domain data & logic
│   │   │   ├── dopplerData.js
│   │   │   ├── arrhythmiaDetection.js
│   │   │   ├── tradingData.js
│   │   │   ├── microbiomeData.js
│   │   │   └── ...
│   │   └── switcherdata/
│   ├── layout-components/   # Layout (sidebar, footer, etc.)
│   ├── constants/            # API URLs, colors
│   └── utils/                # ecgLeads, etc.
│
├── public/
└── package.json
```

---

## Domain → File Mapping

| Domain     | Backend Routers      | Backend Services              | Frontend Pages              |
|-----------|----------------------|-------------------------------|-----------------------------|
| ECG       | ecg_router           | ecg_service, classic_ml_ecg  | signal-viewer/medical/ecg   |
| EEG       | eeg_router           | (via ML/eeg)                  | signal-viewer/medical/eeg   |
| Acoustic  | acoustic_router      | acoustic_service, drone_ml   | signal-viewer/acoustic/*    |
| Trading   | gold_router          | gold_service                 | signal-viewer/trading/*     |
| Microbiome| —                    | —                            | signal-viewer/microbiome    |

---

## Naming Conventions

| Type         | Convention         | Example                          |
|--------------|--------------------|----------------------------------|
| Routers      | `{domain}_router`  | `ecg_router.py`                  |
| Services     | `{domain}_service` or `{feature}_service` | `ecg_service.py`, `classic_ml_ecg_service.py` |
| ML modules   | `ml/{domain}/`     | `ml/ecg/`, `ml/eeg/`             |
| Pages        | `page.js`          | Always in route folder           |
| Components   | PascalCase         | `ContinuousViewer.js`             |
| API paths    | kebab-case         | `/ecg/classic-ml`, `/acoustic/doppler/estimate` |

---

## API Endpoints Summary

| Prefix    | Key Endpoints                                      |
|-----------|----------------------------------------------------|
| `/ecg`    | GET /records, GET /records/{id}, POST /predict, POST /classic-ml |
| `/acoustic` | POST /doppler/estimate, POST /doppler/generate, (drone via /detect/) |
| `/detect` | POST / (drone detection)                           |
| `/eeg`    | (EEG-specific)                                     |
| `/gold`   | (Gold/trading)                                     |
