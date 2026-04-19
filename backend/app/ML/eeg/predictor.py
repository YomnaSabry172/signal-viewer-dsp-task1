import numpy as np
import torch
from scipy.signal import resample
from .model import load_biot_model

LABEL_MAP = {
    0: 'Normal', 1: 'Alcoholism', 2: 'Seizure', 
    3: 'Mental Stress', 4: 'Motor Abnormality', 5: 'Epileptic Interictal'
}

TARGET_SFREQ = 200       # BIOT was trained at 200Hz
WINDOW_SECONDS = 2       # BIOT expects 2-second windows
WINDOW_LENGTH = TARGET_SFREQ * WINDOW_SECONDS  # = 400 samples at 200Hz

def predict_with_model(eeg_data_array, weights_path, cfg):
    # --- 1. Get original sample rate from cfg (passed by router) ---
    original_sfreq = float(cfg.get("sfreq", 200))

    # --- 2. Convert to numpy for resampling, then to Tensor ---
    data_np = eeg_data_array.astype(np.float32)

    # --- 3. Resample to TARGET_SFREQ (200Hz) if needed ---
    if original_sfreq != TARGET_SFREQ:
        num_target_samples = int(data_np.shape[1] * TARGET_SFREQ / original_sfreq)
        print(f"[Predictor] Resampling from {original_sfreq}Hz → {TARGET_SFREQ}Hz "
              f"({data_np.shape[1]} → {num_target_samples} samples)")
        data_np = resample(data_np, num_target_samples, axis=1)

    tensor_data = torch.from_numpy(data_np).float()

    # --- 4. Standardize to 16 Channels (BIOT architecture requirement) ---
    if tensor_data.shape[0] >= 16:
        tensor_data = tensor_data[:16, :]
    else:
        padding = torch.zeros((16 - tensor_data.shape[0], tensor_data.shape[1]))
        tensor_data = torch.cat((tensor_data, padding), dim=0)

    print(f"[Predictor] Shape after resampling + channel fix: {tensor_data.shape}")

    # --- 5. Slice into 2-second windows (400 samples at 200Hz) ---
    num_windows = tensor_data.shape[1] // WINDOW_LENGTH
    if num_windows == 0:
        raise ValueError(
            f"EEG signal too short after resampling: {tensor_data.shape[1]} samples, "
            f"need at least {WINDOW_LENGTH}."
        )

    tensor_data = tensor_data[:, :num_windows * WINDOW_LENGTH]
    # Shape: (num_windows, 16, WINDOW_LENGTH)
    windowed = tensor_data.unfold(dimension=1, size=WINDOW_LENGTH, step=WINDOW_LENGTH).permute(1, 0, 2)

    # --- 6. Normalize each window independently ---
    for i in range(windowed.shape[0]):
        windowed[i] = (windowed[i] - windowed[i].mean()) / (windowed[i].std() + 1e-6)

    print(f"[Predictor] Running inference on {windowed.shape[0]} windows...")

    # --- 7. Model Inference ---
    model, device = load_biot_model(weights_path)
    windowed = windowed.to(device)
    with torch.no_grad():
        outputs = model(windowed)
        probabilities = torch.softmax(outputs, dim=1)
        _, predicted = outputs.max(1)

    # --- 8. Aggregate via Majority Vote + per-class breakdown ---
    pred_list = predicted.tolist()
    final_idx = max(set(pred_list), key=pred_list.count)

    # Build per-class vote counts for the technical breakdown
    raw_predictions = {
        LABEL_MAP[i]: pred_list.count(i)
        for i in range(len(LABEL_MAP))
        if pred_list.count(i) > 0
    }

    return {
        "diagnosis": LABEL_MAP[final_idx],
        "confidence": f"{round((pred_list.count(final_idx) / len(pred_list)) * 100, 1)}% segment agreement",
        "segments": len(pred_list),
        "raw_predictions": raw_predictions,
        "resampled_from": original_sfreq,
    }