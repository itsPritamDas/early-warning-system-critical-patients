"""Prepare patient-level hourly windows from a de-identified wide CSV.

The label column must already identify whether an event occurs within the
chosen future prediction horizon for each timestamp. This script does not
infer labels from patient outcomes; the label-generation rule must be defined
for the dataset and prediction horizon before running this script.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "heart_rate", "respiratory_rate", "sbp", "dbp", "spo2", "temperature",
    "lactate", "creatinine", "wbc", "platelets", "gcs",
]
ID_COL = "patient_id"
TIME_COL = "timestamp"
LABEL_COL = "event_within_horizon"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Wide CSV containing patient/time/features/label")
    parser.add_argument("--output-dir", default="processed", help="Folder for train.npz, validation.npz and test.npz")
    parser.add_argument("--sequence-length", type=int, default=12, help="Hourly rows in each input window (default: 12)")
    parser.add_argument("--test-size", type=float, default=0.15)
    parser.add_argument("--validation-size", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def split_patient_ids(frame: pd.DataFrame, test_size: float, val_size: float, seed: int):
    patients = frame[ID_COL].drop_duplicates().to_numpy()
    if len(patients) < 5:
        raise ValueError("At least 5 distinct patients are required for a meaningful patient-level split.")
    if not 0 < test_size < 1 or not 0 < val_size < 1 or test_size + val_size >= 0.8:
        raise ValueError("test-size and validation-size must be positive and sum to less than 0.8")
    train_val, test_ids = train_test_split(patients, test_size=test_size, random_state=seed, shuffle=True)
    relative_val_size = val_size / (1 - test_size)
    train_ids, val_ids = train_test_split(train_val, test_size=relative_val_size, random_state=seed, shuffle=True)
    return set(train_ids), set(val_ids), set(test_ids)


def hourly_resample(frame: pd.DataFrame) -> pd.DataFrame:
    """Resample each patient's wide observations to hourly buckets.

    Features use hourly means. The precomputed future-event label uses max so
    a positive label in a bucket is preserved. Do not resample across patients.
    """
    pieces = []
    for patient_id, group in frame.groupby(ID_COL, sort=False):
        group = group.sort_values(TIME_COL).set_index(TIME_COL)
        agg = {feature: "mean" for feature in FEATURES}
        agg[LABEL_COL] = "max"
        hourly = group[FEATURES + [LABEL_COL]].resample("1h").agg(agg)
        hourly[ID_COL] = patient_id
        pieces.append(hourly.reset_index())
    if not pieces:
        raise ValueError("No patient records found in the input file.")
    return pd.concat(pieces, ignore_index=True)


def fill_patient_gaps(frame: pd.DataFrame, medians: pd.Series) -> pd.DataFrame:
    chunks = []
    for _, group in frame.groupby(ID_COL, sort=False):
        group = group.sort_values(TIME_COL).copy()
        group[FEATURES] = group[FEATURES].ffill()
        group[FEATURES] = group[FEATURES].fillna(medians)
        chunks.append(group)
    return pd.concat(chunks, ignore_index=True)


def make_windows(frame: pd.DataFrame, scaler: StandardScaler, seq_len: int):
    xs, ys = [], []
    scaled = frame.copy()
    scaled[FEATURES] = scaler.transform(scaled[FEATURES].astype(float))
    for _, group in scaled.groupby(ID_COL, sort=False):
        group = group.sort_values(TIME_COL)
        values = group[FEATURES].to_numpy(dtype=np.float32)
        labels = group[LABEL_COL].to_numpy(dtype=np.float32)
        for end in range(seq_len - 1, len(group)):
            xs.append(values[end - seq_len + 1:end + 1])
            ys.append(labels[end])
    if not xs:
        return np.empty((0, seq_len, len(FEATURES)), dtype=np.float32), np.empty((0,), dtype=np.float32)
    return np.stack(xs).astype(np.float32), np.asarray(ys, dtype=np.float32)


def main() -> None:
    args = parse_args()
    if args.sequence_length < 2:
        raise ValueError("sequence-length must be at least 2")
    source = Path(args.input)
    if not source.is_file():
        raise FileNotFoundError(f"Input CSV not found: {source}")
    raw = pd.read_csv(source)
    required = {ID_COL, TIME_COL, LABEL_COL, *FEATURES}
    missing = sorted(required - set(raw.columns))
    if missing:
        raise ValueError("Input CSV is missing required columns: " + ", ".join(missing))
    raw[TIME_COL] = pd.to_datetime(raw[TIME_COL], errors="coerce", utc=True)
    raw[LABEL_COL] = pd.to_numeric(raw[LABEL_COL], errors="coerce")
    for feature in FEATURES:
        raw[feature] = pd.to_numeric(raw[feature], errors="coerce")
    raw = raw.dropna(subset=[ID_COL, TIME_COL, LABEL_COL]).copy()
    if raw.empty:
        raise ValueError("No valid rows remain after timestamp/label validation.")
    if not raw[LABEL_COL].isin([0, 1]).all():
        raise ValueError(f"{LABEL_COL} must contain only binary values 0 or 1.")
    # Keep this input de-identified. Do not add names, MRNs or direct identifiers.
    hourly = hourly_resample(raw)
    hourly = hourly.dropna(subset=[LABEL_COL]).copy()
    hourly[LABEL_COL] = hourly[LABEL_COL].astype(int).clip(0, 1)
    train_ids, val_ids, test_ids = split_patient_ids(hourly, args.test_size, args.validation_size, args.seed)
    train_df = hourly[hourly[ID_COL].isin(train_ids)].copy()
    val_df = hourly[hourly[ID_COL].isin(val_ids)].copy()
    test_df = hourly[hourly[ID_COL].isin(test_ids)].copy()
    medians = train_df[FEATURES].median().fillna(0.0)
    train_df = fill_patient_gaps(train_df, medians)
    val_df = fill_patient_gaps(val_df, medians)
    test_df = fill_patient_gaps(test_df, medians)
    scaler = StandardScaler()
    scaler.fit(train_df[FEATURES].astype(float))
    output = Path(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)
    counts = {}
    for name, split in [("train", train_df), ("validation", val_df), ("test", test_df)]:
        x, y = make_windows(split, scaler, args.sequence_length)
        if not len(y):
            raise ValueError(f"No {name} windows generated. Ensure each split has patients with at least {args.sequence_length} hourly rows.")
        np.savez_compressed(output / f"{name}.npz", X=x, y=y)
        counts[name] = {"windows": int(len(y)), "positive_labels": int(y.sum()), "patients": int(split[ID_COL].nunique())}
    manifest = {
        "source_file": source.name,
        "features": FEATURES,
        "label_column": LABEL_COL,
        "timestamp_column": TIME_COL,
        "sequence_length_hours": args.sequence_length,
        "resampling_frequency": "1h",
        "patient_level_split": True,
        "normalization": "StandardScaler fit on training split only",
        "missing_values": "within-patient forward fill then training-split median imputation",
        "splits": counts,
        "warning": "Research data preparation only; verify label horizon, cohort design, de-identification and temporal leakage controls before interpretation."
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    # Save scaler parameters explicitly so deployment can reproduce training normalization.
    np.savez(output / "scaler.npz", mean=scaler.mean_, scale=scaler.scale_, features=np.asarray(FEATURES))
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
