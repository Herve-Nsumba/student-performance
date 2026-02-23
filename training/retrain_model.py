"""
Retrain the student_performance_rf.pkl model so it produces predictions
across the full 0-100 range, enabling meaningful risk stratification.

Problem: The original training data had 90% of targets in 50-75 and almost
none below 50, so the Random Forest could never predict "high risk" (< 50).

Fix: Augment the training data with synthetic samples covering the full
0-100 range while preserving the learned relationships.  The synthetic
data makes the relationship explicit:
    predicted_score ~ f(Previous_Scores, Attendance, Hours_Studied, Tutoring_Sessions)

Usage:
    python retrain_model.py
"""

import csv
import os
import sys
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

DATA_DIR = Path(__file__).parent / "Data"
MODEL_OUT = Path(__file__).resolve().parents[1] / "models" / "student_performance_rf.pkl"

# ── helpers ──────────────────────────────────────────────────────

def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def safe_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


STUDY_TIME_MAP = {
    "<2 hours": 1.0,
    "2 to 5 hours": 3.5,
    "5 to 10 hours": 7.5,
    ">10 hours": 12.0,
}

# ── load the three original datasets ─────────────────────────────

def load_dataset1():
    """StudentPerformanceFactors.csv"""
    rows = read_csv(DATA_DIR / "StudentPerformanceFactors.csv")
    X, y = [], []
    for r in rows:
        X.append([
            safe_float(r["Previous_Scores"]),
            safe_float(r["Attendance"]),
            safe_float(r["Hours_Studied"]),
            safe_float(r["Tutoring_Sessions"]),
        ])
        y.append(safe_float(r["Exam_Score"]))
    return np.array(X), np.array(y)


def load_dataset2():
    """student_performance_interactions.csv"""
    rows = read_csv(DATA_DIR / "student_performance_interactions.csv")
    X, y = [], []
    for r in rows:
        X.append([
            safe_float(r.get("previous_score", 0)),
            safe_float(r.get("attendance_percentage", 0)),
            safe_float(r.get("daily_study_hours", 0)),
            0.0,  # no tutoring column in this dataset
        ])
        y.append(safe_float(r["final_score"]))
    return np.array(X), np.array(y)


def load_dataset3():
    """student_math_clean.csv  (grades are 0-20, scaled *5 to 0-100)"""
    rows = read_csv(DATA_DIR / "student_math_clean.csv")
    X, y = [], []

    # Get max absences for normalization
    absences = [safe_float(r["absences"]) for r in rows]
    max_abs = max(absences) if max(absences) > 0 else 1

    for r in rows:
        prev = safe_float(r["grade_2"]) * 5  # scale 0-20 -> 0-100
        attend = 100 - (safe_float(r["absences"]) / max_abs * 100)
        hours = STUDY_TIME_MAP.get(r.get("study_time", ""), 3.5)
        tutor = 1.0 if r.get("extra_paid_classes", "").strip().lower() == "yes" else 0.0
        target = safe_float(r["final_grade"]) * 5

        X.append([prev, attend, hours, tutor])
        y.append(target)
    return np.array(X), np.array(y)


# ── generate synthetic data covering the full 0-100 range ────────

def generate_synthetic(n=4000, seed=42):
    """
    Create synthetic samples where the target is a clear function of the
    four features.  This teaches the model that low inputs => low scores.

    Feature ranges (matching the app's expected input ranges):
        Previous_Scores : 0 - 100
        Attendance       : 0 - 100 (%)
        Hours_Studied    : 0 - 44
        Tutoring_Sessions: 0 - 8
    """
    rng = np.random.RandomState(seed)

    prev = rng.uniform(0, 100, n)
    attend = rng.uniform(0, 100, n)
    hours = rng.uniform(0, 44, n)
    tutor = rng.randint(0, 9, n).astype(float)

    # Weighted combination -> target in [0, 100]
    # Weights chosen to reflect domain importance:
    #   Previous_Scores has strongest influence (40%)
    #   Attendance next (30%)
    #   Hours_Studied (20%, normalized to 0-100 scale)
    #   Tutoring_Sessions (10%, normalized to 0-100 scale)
    raw = (
        0.40 * prev
        + 0.30 * attend
        + 0.20 * (hours / 44 * 100)
        + 0.10 * (tutor / 8 * 100)
    )
    # Add noise
    noise = rng.normal(0, 5, n)
    target = np.clip(raw + noise, 0, 100)

    X = np.column_stack([prev, attend, hours, tutor])
    return X, target


# ── main ─────────────────────────────────────────────────────────

def main():
    print("Loading datasets...")
    X1, y1 = load_dataset1()
    X2, y2 = load_dataset2()
    X3, y3 = load_dataset3()
    print(f"  Dataset 1: {X1.shape[0]} samples (target range {y1.min():.0f}-{y1.max():.0f})")
    print(f"  Dataset 2: {X2.shape[0]} samples (target range {y2.min():.0f}-{y2.max():.0f})")
    print(f"  Dataset 3: {X3.shape[0]} samples (target range {y3.min():.0f}-{y3.max():.0f})")

    print("\nGenerating synthetic data for full-range coverage...")
    Xs, ys = generate_synthetic(n=4000)
    print(f"  Synthetic:  {Xs.shape[0]} samples (target range {ys.min():.0f}-{ys.max():.0f})")

    # Combine all
    X_all = np.vstack([X1, X2, X3, Xs])
    y_all = np.concatenate([y1, y2, y3, ys])
    print(f"\nCombined: {X_all.shape[0]} samples")

    # Show target distribution
    below50 = (y_all < 50).sum()
    mid = ((y_all >= 50) & (y_all < 75)).sum()
    above75 = (y_all >= 75).sum()
    print(f"  Target distribution:  <50={below50} ({below50/len(y_all)*100:.1f}%), "
          f"50-75={mid} ({mid/len(y_all)*100:.1f}%), "
          f">=75={above75} ({above75/len(y_all)*100:.1f}%)")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_all, y_all, test_size=0.2, random_state=42
    )

    print(f"\nTraining Random Forest (n_estimators=800)...")
    model = RandomForestRegressor(
        n_estimators=800,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    print(f"  MAE:  {mae:.2f}")
    print(f"  RMSE: {rmse:.2f}")
    print(f"  R^2:  {r2:.4f}")

    # Show prediction range
    print(f"\n  Prediction range on test set: {y_pred.min():.1f} - {y_pred.max():.1f}")
    pred_below50 = (y_pred < 50).sum()
    pred_mid = ((y_pred >= 50) & (y_pred < 75)).sum()
    pred_above75 = (y_pred >= 75).sum()
    print(f"  Predicted distribution: <50={pred_below50}, 50-75={pred_mid}, >=75={pred_above75}")

    # Sanity checks with extreme inputs
    print("\nSanity checks:")
    checks = [
        ("All zeros",      [0, 0, 0, 0]),
        ("All low",        [20, 30, 2, 0]),
        ("Average",        [60, 70, 15, 2]),
        ("All high",       [95, 95, 40, 6]),
        ("All max",        [100, 100, 44, 8]),
    ]
    for label, features in checks:
        pred = model.predict(np.array([features]))[0]
        risk = "HIGH" if pred < 50 else ("MEDIUM" if pred < 75 else "LOW")
        print(f"  {label:20s} -> predicted={pred:5.1f}  risk={risk}")

    # Save
    os.makedirs(MODEL_OUT.parent, exist_ok=True)
    joblib.dump(model, MODEL_OUT)
    print(f"\nModel saved to {MODEL_OUT}")


if __name__ == "__main__":
    main()
