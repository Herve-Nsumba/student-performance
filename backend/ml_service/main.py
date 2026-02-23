import os
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field


# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(
    os.getenv(
        "MODEL_PATH",
        str(Path(__file__).resolve().parents[2] / "models" / "student_performance_rf.pkl"),
    )
)



# --- App ---
app = FastAPI(title="Student Performance ML Service", version="1.0")

model = None


class PredictInput(BaseModel):
    Previous_Scores: float = Field(..., description="Previous assessment scores")
    Attendance: float = Field(..., description="Attendance value (keep consistent with training)")
    Hours_Studied: float = Field(..., description="Hours studied")
    Tutoring_Sessions: int = Field(..., ge=0, description="Number of tutoring sessions")


class PredictOutput(BaseModel):
    predicted_value: float


@app.on_event("startup")
def load_model():
    global model
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", response_model=PredictOutput)
def predict(payload: PredictInput):
    # IMPORTANT: feature order must match training
    X = np.array([[
        payload.Previous_Scores,
        payload.Attendance,
        payload.Hours_Studied,
        payload.Tutoring_Sessions,
    ]], dtype=float)

    y_pred = model.predict(X)

    # y_pred is usually array-like; return first element as float
    return PredictOutput(predicted_value=float(y_pred[0]))
