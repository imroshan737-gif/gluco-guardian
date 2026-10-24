"""Reproduce the research-only forecast. Raw dataset stays outside the app.
Usage: python3 scripts/train-glucose-model.py /tmp/glucose-training/uom
Requires numpy, pandas, scikit-learn. Downloads: see docs/glucose-model.md.
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

root = Path(sys.argv[1])
files = sorted(root.glob("*/Glucose Data/*.csv"))
groups = {}
raw_count = 0
hashes = {}
for path in files:
    frame = pd.read_csv(path)
    raw_count += len(frame)
    hashes[path.name] = hashlib.sha256(path.read_bytes()).hexdigest()
    # Dates such as 16/11/2023 establish day-first format in the released CSVs.
    frame["time"] = pd.to_datetime(frame.bg_ts, dayfirst=True, format="mixed", errors="coerce")
    frame["glucose"] = pd.to_numeric(frame.value, errors="coerce") * 18.0182
    frame = frame.dropna(subset=["time", "glucose"])
    frame = frame[frame.glucose.between(40, 400)].sort_values("time")
    groups[path.stem[-4:]] = frame.groupby("time").glucose.mean()

# Remove exact shared timestamp/value observations from later participant files
# before splitting, so duplicated measurements cannot leak between groups.
seen = set()
removed = 0
windows = {}
for participant, series in groups.items():
    keep = []
    for timestamp, value in series.items():
        key = (timestamp.value, round(value, 5))
        keep.append(key not in seen)
        seen.add(key)
    removed += len(series) - sum(keep)
    series = series.loc[keep].resample("15min").mean()
    # Complete 60-minute histories and four future targets; never fill gaps.
    blocks = np.lib.stride_tricks.sliding_window_view(series.to_numpy(), 9)
    blocks = blocks[np.isfinite(blocks).all(axis=1)]
    windows[participant] = blocks

usable = sorted(k for k,v in windows.items() if len(v) > 0)
rng = np.random.default_rng(42)
order = list(rng.permutation(usable))
test_ids, val_ids, train_ids = order[:3], order[3:6], order[6:]
def xy(ids):
    data = np.concatenate([windows[k] for k in ids])
    history, future = data[:, :5], data[:, 5:]
    # Model learns future changes relative to the last observed reading.
    return history, future - history[:, -1, None]
train_x, train_y = xy(train_ids)
val_x, val_y = xy(val_ids)
test_x, test_y = xy(test_ids)
model = ExtraTreesRegressor(n_estimators=128, max_depth=8, min_samples_leaf=30,
                           random_state=42, n_jobs=-1)
model.fit(train_x, train_y)
val_errors = np.abs(model.predict(val_x) - val_y)
radius = np.quantile(val_errors, 0.90, axis=0, method="higher")
prediction = model.predict(test_x)
metrics = []
for i, minutes in enumerate([15,30,45,60]):
    metrics.append({"minutes": minutes,
        "mae": round(mean_absolute_error(test_y[:,i], prediction[:,i]), 2),
        "rmse": round(np.sqrt(mean_squared_error(test_y[:,i], prediction[:,i])), 2),
        "persistenceMae": round(mean_absolute_error(test_y[:,i], np.zeros(len(test_y))), 2),
        "intervalRadius": round(float(radius[i]), 2),
        "testCoverage": round(float(np.mean(np.abs(test_y[:,i]-prediction[:,i]) <= radius[i]))*100, 1)})
trees = []
for estimator in model.estimators_:
    t = estimator.tree_
    trees.append({"left": t.children_left.tolist(), "right": t.children_right.tolist(),
        "feature": t.feature.tolist(), "threshold": np.round(t.threshold, 6).tolist(),
        "value": np.round(t.value[:,:,0], 6).tolist()})
metadata = {"name": "GlucoSense Extra Trees v1", "algorithm": "ExtraTreesRegressor",
    "trainedAt": datetime.now(timezone.utc).isoformat(), "seed": 42,
    "treeCount": 128, "maxDepth": 8, "minSamplesLeaf": 30,
    "source": "T1D-UOM, University of Manchester (Alsuhaymi et al.)",
    "sourceUrl": "https://zenodo.org/records/15196914", "doi": "10.5281/zenodo.15196914",
    "license": "CC BY 4.0", "rawReadings": raw_count, "participantFiles": len(files),
    "duplicateObservationsRemoved": removed, "trainParticipants": train_ids,
    "validationParticipants": val_ids, "testParticipants": test_ids,
    "trainWindows": len(train_x), "validationWindows": len(val_x), "testWindows": len(test_x),
    "inputMinutes": [-60,-45,-30,-15,0], "horizons": [15,30,45,60],
    "inputMin": 40, "inputMax": 400, "metrics": metrics, "sourceSha256": hashes}
out = Path("src/lib/models")
out.mkdir(parents=True, exist_ok=True)
(out / "glucose-model.json").write_text(json.dumps({"metadata":metadata, "trees":trees}, separators=(",",":")))
print(json.dumps(metadata, indent=2))