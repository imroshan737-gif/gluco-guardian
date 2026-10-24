# GlucoSense Extra Trees v1 — research model card

This is an experimental glucose-only forecasting ensemble, not a large foundation model,
clinical device, validated hypoglycaemia classifier or treatment recommendation system.
The separate risk score remains the existing hand-written weighted heuristic, not this model.

## Data and attribution

T1D-UOM — A Longitudinal Multimodal Dataset of Type 1 Diabetes, Alsuhaymi,
Bilal, Gasca Garcia, Kongdee, Lubasinski, Thabit, Nutter and Harper,
University of Manchester. Licensed CC BY 4.0; adaptation: preprocessing and trained model.
Source release: https://zenodo.org/records/15196914
DOI: https://doi.org/10.5281/zenodo.15196914
License: https://creativecommons.org/licenses/by/4.0/
Download: https://zenodo.org/api/records/15196914/files/sharpic/ManchesterCSCoordinatedDiabetesStudy-V1.0.2.zip/content

Inspected release contains 356,146 raw glucose records across 17 participant-ID files.
README overview says 16 individuals, whereas its table and archive have 17 glucose files;
therefore 17 files must not be presented as 17 independently confirmed individuals.
Data collected in 2023–2024; publisher reports University of Manchester ethical approval
2024-15687-33719. No identifiable raw patient files are shipped in this app.

## Reproduction and preprocessing

Install numpy, pandas and scikit-learn with Python; download and unzip outside the app.
Run `python3 scripts/train-glucose-model.py /tmp/glucose-training/uom` from the project root.
The script exports weights and metadata to `src/lib/models/glucose-model.json`.
Source file SHA256 hashes, model settings and actual run timestamp are in the artifact.

Dates are parsed day-first (actual released examples include 16/11/2023, despite the
README dictionary saying MM/DD). Convert mmol/L to mg/dL using 18.0182.
Drop missing/invalid times and glucose outside 40–400 mg/dL. Average duplicate timestamps.
Remove exact timestamp/glucose observations already seen in earlier ID files (15,723 removed).
Average into 15-minute clock-aligned bins; never interpolate or forward-fill gaps.
Each complete nine-bin window uses five historical bins and four future target bins.
Training targets are glucose changes relative to the final history bin.

Seed 42 divides file IDs into train/validation/test (11/3/3) before model training.
Training: 85,665 windows; validation: 28,178; test: 24,181.
128 ExtraTreesRegressor trees; maximum depth 8; minimum leaf 30; default remaining
scikit-learn 1.9.1 parameters. No model selection used test results.

## Measured test results (mg/dL)

| Horizon | MAE | RMSE | Last-value baseline MAE | Test interval coverage |
|---|---:|---:|---:|---:|
| 15 min | 9.04 | 13.11 | 10.21 | 88.3% |
| 30 min | 16.24 | 23.03 | 18.01 | 89.3% |
| 45 min | 21.81 | 30.35 | 24.18 | 89.8% |
| 60 min | 26.14 | 35.81 | 29.21 | 90.4% |

Uncertainty bands use the 90th percentile of absolute validation residuals per horizon:
19.43, 36.25, 49.63 and 60.22 mg/dL. They are empirical error bands, not a guaranteed
personal confidence interval; correlated overlapping windows invalidate an independent-sample
interpretation. Test coverage is measured, not assumed to be 90%.

## Application and limitations

Only real saved readings appear as actual observations. Inference requires five consecutive
15-minute history bins, latest reading no older than 20 minutes, and inputs within 40–400.
Outputs outside 40–400 are rejected, not clipped. Average tree-predicted deltas are added
to the last bin's mean. Predictions end at 60 minutes; 1H/3H/6H/24H select history windows,
not unsupported forecast horizons. Forecast times align to the same clock bins used in training.

17 file IDs are not proof of independent people; exact shared observations were removed,
but potential non-exact duplication, unknown sensor effects and correlated windows remain.
Manual logs may not match sensor distributions. No meals, insulin, activity, sleep, or stress
are inputs to this glucose model. Data only concern a small T1D research cohort, so no
generalization claim is made for other populations. No prospective, external or clinical
safety validation, subgroup analysis or hypoglycaemia-event sensitivity evaluation has been
performed. Never use its forecasts or bands to change insulin or delay urgent medical care.