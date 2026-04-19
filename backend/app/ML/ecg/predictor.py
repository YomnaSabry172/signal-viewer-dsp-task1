# ECGPredictor: loads PTBCNN (trained on PTB Diagnostic 1000 Hz) and predicts class from 12-lead ECG.
import json
import numpy as np
import torch
import wfdb

from .model import PTBCNN

DESIRED_LEADS = ["i","ii","iii","avr","avl","avf","v1","v2","v3","v4","v5","v6"]

class ECGPredictor:
    def __init__(self, weights_path: str, labels_path: str, device: str | None = None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))

        with open(labels_path, "r") as f:
            meta = json.load(f)
        self.class_names = meta["class_names"]
        self.num_classes = len(self.class_names)

        self.model = PTBCNN(num_classes=self.num_classes).to(self.device)
        sd = torch.load(weights_path, map_location=self.device)
        self.model.load_state_dict(sd)
        self.model.eval()

    def _extract_12lead(self, record_base: str):
        rec = wfdb.rdrecord(record_base)
        sig = rec.p_signal.astype(np.float32)
        names = [n.lower() for n in rec.sig_name]
        name_to_idx = {n: i for i, n in enumerate(names)}
        idxs = [name_to_idx[n] for n in DESIRED_LEADS if n in name_to_idx]
        if len(idxs) != 12:
            raise RuntimeError(f"Missing ECG leads in record {record_base}. Found {len(idxs)}")
        return rec, sig[:, idxs]

    def predict_window(self, record_base: str, start_sec: float = 0.0, seconds: float = 10.0):
        rec, ecg12 = self._extract_12lead(record_base)

        fs = int(rec.fs)
        start = int(start_sec * fs)
        win = int(seconds * fs)
        end = start + win

        if start < 0:
            start = 0
        if end <= start:
            end = start + win

        if end > ecg12.shape[0]:
            pad = end - ecg12.shape[0]
            x = np.pad(ecg12[start:], ((0, pad), (0, 0)), mode="edge")
        else:
            x = ecg12[start:end]

        x = x.T  # (12, win)
        x = (x - x.mean(axis=1, keepdims=True)) / (x.std(axis=1, keepdims=True) + 1e-8)

        X = torch.from_numpy(x[None, :, :]).float().to(self.device)

        with torch.no_grad():
            logits = self.model(X)
            probs = torch.softmax(logits, dim=1).detach().cpu().numpy()[0]

        pred = int(np.argmax(probs))
        label = self.class_names[pred]
        normal_abnormal = "Normal" if label == "Healthy controls" else "Abnormal"

        return {
            "normal_abnormal": normal_abnormal,
            "abnormality_type": (label if normal_abnormal == "Abnormal" else "Healthy controls"),
            "confidence": float(probs[pred]),
            "probs": {self.class_names[i]: float(probs[i]) for i in range(self.num_classes)},
            "fs": fs,
            "start_sec": float(start_sec),
            "seconds": float(seconds),
        }

