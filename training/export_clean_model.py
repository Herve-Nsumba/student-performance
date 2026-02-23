import joblib
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

BASE = Path(__file__).resolve().parent
DATA_DIR = BASE / "Data"
OUT_DIR = BASE.parent / "models"
OUT_DIR.mkdir(exist_ok=True)

FEATURES = ["Previous_Scores", "Attendance", "Hours_Studied", "Tutoring_Sessions"]

df1 = pd.read_csv(DATA_DIR / "StudentPerformanceFactors.csv")
y = df1["Exam_Score"]
X = df1[FEATURES]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(random_state=42)
model.fit(X_train, y_train)

out_path = OUT_DIR / "student_performance_rf.pkl"
joblib.dump(model, out_path)
print("Saved clean model to:", out_path)

loaded = joblib.load(out_path)
print("Loaded model type:", type(loaded))
print("Has predict:", hasattr(loaded, "predict"))

