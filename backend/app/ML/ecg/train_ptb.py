"""
Train PTBCNN on PTB Diagnostic database (1000 Hz, 12-lead).
Uses full dataset with train / val / test split for reliable confidence.

Usage:
  python -m app.ML.ecg.train_ptb
  python -m app.ML.ecg.train_ptb --dataset-dir "C:/path/to/ptb-diagnostic-ecg-database-1.0.0"
"""
from pathlib import Path
import argparse
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split

from app.core.config import PTB_FULL_DATASET_DIR

from .model import PTBCNN
from .ptb_dataset import discover_ptb_records, load_ptb_segment


class PTBDataset(Dataset):
    def __init__(self, records, dataset_dir: Path, duration_sec: float = 10.0):
        self.records = records  # [(record_id, label), ...]
        self.dataset_dir = dataset_dir
        self.duration_sec = duration_sec
        self.input_len = int(1000 * duration_sec)

    def __len__(self):
        return len(self.records)

    def __getitem__(self, i):
        record_id, label = self.records[i]
        x = load_ptb_segment(
            self.dataset_dir, record_id, start_sec=0.0, duration_sec=self.duration_sec
        )
        x = (x - x.mean(axis=1, keepdims=True)) / (x.std(axis=1, keepdims=True) + 1e-8)
        if x.shape[1] != self.input_len:
            if x.shape[1] < self.input_len:
                x = np.pad(x, ((0, 0), (0, self.input_len - x.shape[1])), mode="edge")
            else:
                x = x[:, : self.input_len]
        return torch.from_numpy(x).float(), label


def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = 0.0
    correct = 0
    n = 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * x.size(0)
        correct += (logits.argmax(1) == y).sum().item()
        n += x.size(0)
    return total_loss / n, correct / n


def eval_epoch(model, loader, criterion, device):
    model.eval()
    total_loss = 0.0
    correct = 0
    n = 0
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = criterion(logits, y)
            total_loss += loss.item() * x.size(0)
            correct += (logits.argmax(1) == y).sum().item()
            n += x.size(0)
    return total_loss / n, correct / n


def main():
    parser = argparse.ArgumentParser(description="Train PTBCNN on PTB Diagnostic")
    parser.add_argument(
        "--dataset-dir",
        type=str,
        default=str(PTB_FULL_DATASET_DIR),
        help="Path to PTB Diagnostic database (e.g. .../ptb-diagnostic-ecg-database-1.0.0)",
    )
    parser.add_argument("--epochs", type=int, default=100, help="Training epochs")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for splits")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    if not dataset_dir.exists():
        raise SystemExit(f"Dataset not found: {dataset_dir}")

    records = discover_ptb_records(dataset_dir)
    if not records:
        raise SystemExit("No PTB records found. Check --dataset-dir.")

    labels_path = Path(__file__).resolve().parent / "labels.json"
    with open(labels_path) as f:
        meta = json.load(f)
    class_names = meta["class_names"]
    num_classes = len(class_names)

    # Filter out records we couldn't load
    valid = []
    for rid, lbl in records:
        try:
            load_ptb_segment(dataset_dir, rid, 0.0, 10.0)
            valid.append((rid, lbl))
        except Exception as e:
            print(f"Skip {rid}: {e}")
    records = valid
    print(f"Using {len(records)} records from {dataset_dir}")

    # Train (80%) / Val (10%) / Test (10%) – stratified when possible
    X_idx = list(range(len(records)))
    y = [r[1] for r in records]
    try:
        train_idx, test_idx = train_test_split(
            X_idx, test_size=0.2, stratify=y, random_state=args.seed
        )
    except ValueError:
        train_idx, test_idx = train_test_split(
            X_idx, test_size=0.2, random_state=args.seed
        )
    y_train = [y[i] for i in train_idx]
    try:
        train_idx, val_idx = train_test_split(
            train_idx, test_size=0.125, stratify=y_train, random_state=args.seed
        )
    except ValueError:
        train_idx, val_idx = train_test_split(train_idx, test_size=0.125, random_state=args.seed)

    train_rec = [records[i] for i in train_idx]
    val_rec = [records[i] for i in val_idx]
    test_rec = [records[i] for i in test_idx]

    out_dir = Path(__file__).resolve().parent
    splits = {
        "train": [r[0] for r in train_rec],
        "val": [r[0] for r in val_rec],
        "test": [r[0] for r in test_rec],
        "dataset_dir": str(dataset_dir),
        "seed": args.seed,
    }
    with open(out_dir / "splits.json", "w") as f:
        json.dump(splits, f, indent=2)
    print(f"Split: train={len(train_rec)} val={len(val_rec)} test={len(test_rec)}")
    print(f"Splits saved to {out_dir / 'splits.json'}")

    train_ds = PTBDataset(train_rec, dataset_dir, duration_sec=10.0)
    val_ds = PTBDataset(val_rec, dataset_dir, duration_sec=10.0)
    test_ds = PTBDataset(test_rec, dataset_dir, duration_sec=10.0)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = PTBCNN(num_classes=num_classes).to(device)
    counts = np.bincount([r[1] for r in train_rec], minlength=num_classes)
    weights = 1.0 / (counts + 1e-6)
    weights = weights / weights.sum() * num_classes
    criterion = nn.CrossEntropyLoss(weight=torch.tensor(weights, dtype=torch.float32, device=device))
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    train_loader = DataLoader(
        train_ds, batch_size=32, shuffle=True, num_workers=0, pin_memory=False
    )
    val_loader = DataLoader(
        val_ds, batch_size=32, shuffle=False, num_workers=0, pin_memory=False
    )
    test_loader = DataLoader(
        test_ds, batch_size=32, shuffle=False, num_workers=0, pin_memory=False
    )

    best_acc = 0.0
    weights_path = out_dir / "ptb_weights.pt"

    for ep in range(args.epochs):
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = eval_epoch(model, val_loader, criterion, device)
        print(f"Epoch {ep+1}/{args.epochs}: train loss={train_loss:.4f} acc={train_acc:.4f} | val loss={val_loss:.4f} acc={val_acc:.4f}")
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), weights_path)
            print(f"  -> saved best ({val_acc:.4f})")

    # Final evaluation on held-out test set
    model.load_state_dict(torch.load(weights_path, map_location=device))
    test_loss, test_acc = eval_epoch(model, test_loader, criterion, device)
    print(f"\nBest val acc: {best_acc:.4f}")
    print(f"Test acc: {test_acc:.4f}")
    print(f"Weights saved to: {weights_path}")


if __name__ == "__main__":
    main()
