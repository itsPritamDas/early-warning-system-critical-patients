# CNN–LSTM + Attention Research Code

This folder contains an executable research scaffold aligned with the model architecture described in the project report. It is separate from the static GitHub Pages dashboard.

## Important distinction

The public dashboard runs without Python and displays synthetic values using an illustrative formula. It does **not** load these model weights or run a trained CNN–LSTM. The report's sample results (including 90.8% accuracy) are not reproduced by this code unless you run a documented experiment on a defined dataset and obtain comparable results.

## 1. Dataset expectations

Use only an authorized, de-identified dataset. MIMIC data access may require credentialing, training, and a data-use agreement. Do not commit patient-level data or identifiers to a public repository.

Prepare a **wide CSV** with one row per patient observation, containing these exact columns:

- `patient_id`: pseudonymous grouping key used only for patient-level splitting
- `timestamp`: observation timestamp parseable by pandas
- `event_within_horizon`: binary target for whether the chosen deterioration event occurs within your defined future prediction horizon
- `heart_rate`, `respiratory_rate`, `sbp`, `dbp`, `spo2`, `temperature`, `lactate`, `creatinine`, `wbc`, `platelets`, `gcs`

The outcome label must be created from the study's event definition and prediction horizon before running the script. Define censoring, first-event time, exclusion criteria, and the observation/prediction windows before modeling. This code does not infer clinical labels from raw notes or ICU tables.

## 2. Install dependencies

From this folder, create a virtual environment and install the requirements:

```bash
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Prepare the data

```bash
python prepare_data.py --input /path/to/authorized_deidentified_data.csv --output-dir processed --sequence-length 12
```

The script resamples each patient to hourly records, forward-fills within a patient, imputes remaining feature gaps with medians from the training patients, splits at patient level, and fits normalization statistics on the training split only. It saves `train.npz`, `validation.npz`, `test.npz`, `scaler.npz`, and `manifest.json` to the output directory. Every split must contain enough records to create at least one full sequence.

## 4. Train and evaluate

```bash
python train.py --data-dir processed --output-dir artifacts --epochs 30 --batch-size 64
```

The model combines 1D convolution, a bidirectional LSTM, temporal attention, and a binary classifier. Training uses weighted binary cross-entropy and early stopping on validation loss. The script saves the best checkpoint, validation/test metrics, and training-loss history. Metrics include accuracy, precision, sensitivity/recall, F1, AUROC, AUPRC when both classes are present, and the confusion matrix.

## Before reporting model performance

- Keep all windows from a patient in a single split.
- Define labels and prediction horizons without using future inputs.
- Inspect positive/negative case counts and data leakage risks.
- Compare against appropriate baselines using the same split and features.
- Report AUROC, AUPRC, sensitivity, precision, calibration, false alerts per patient-day, and lead time, not accuracy alone.
- Perform external validation and clinical review before considering deployment.

This code is an educational research scaffold and is not a medical device.
