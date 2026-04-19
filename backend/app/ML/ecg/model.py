# ECG classification models for 12-lead data.
# MultiLeadCNN: original (flexible length, was trained on PTB-XL ~100 Hz).
# PTBCNN: designed for PTB Diagnostic at 1000 Hz, input (12, 10000) for 10 s.
import torch
import torch.nn as nn

# --- PTB Diagnostic 1000 Hz model ---
SAMPLE_RATE = 1000
WINDOW_SEC = 10.0
PTB_INPUT_LEN = int(SAMPLE_RATE * WINDOW_SEC)  # 10000


class PTBCNN(nn.Module):
    """CNN for PTB Diagnostic 12-lead ECG at 1000 Hz. Input: (B, 12, 10000)."""

    def __init__(self, num_classes: int = 9):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv1d(12, 32, kernel_size=31, padding=15),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(32, 64, kernel_size=15, padding=7),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(64, 128, kernel_size=7, padding=3),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(128, 256, kernel_size=5, padding=2),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.classifier = nn.Linear(256, num_classes)

    def forward(self, x):
        x = self.features(x)
        x = x.squeeze(-1)
        return self.classifier(x)


class MultiLeadCNN(nn.Module):
    def __init__(self, num_classes: int = 9):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv1d(12, 32, kernel_size=7, padding=3),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(2),

            nn.Conv1d(32, 64, kernel_size=7, padding=3),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(2),

            nn.Conv1d(64, 128, kernel_size=7, padding=3),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.classifier = nn.Linear(128, num_classes)

    def forward(self, x):
        x = self.features(x)
        x = x.squeeze(-1)
        return self.classifier(x)