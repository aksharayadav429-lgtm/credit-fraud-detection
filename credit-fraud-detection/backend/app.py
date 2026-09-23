from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "fraud_model.pkl"
EVALUATION_PATH = BASE_DIR / "model" / "evaluation_data.pkl"
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = FastAPI(title="Credit Card Fraud Detection API")

# The frontend is served by this same FastAPI service on Render.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained model and scaler.
saved_data = joblib.load(MODEL_PATH)
model = saved_data["model"]
scaler = saved_data["scaler"]

# Load the small precomputed evaluation set.
evaluation_data = joblib.load(EVALUATION_PATH)
y_test = evaluation_data["y_test"]
probabilities = evaluation_data["probabilities"]

# Original model feature names (Time, V1...V28, Amount).
FEATURE_NAMES = [
    "Time",
    *[f"V{i}" for i in range(1, 29)],
    "Amount",
]


@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/style.css")
def style():
    return FileResponse(FRONTEND_DIR / "style.css", media_type="text/css")


@app.get("/script.js")
def script():
    return FileResponse(
        FRONTEND_DIR / "script.js",
        media_type="application/javascript",
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict_transaction(data: dict):
    amount = float(data.get("amount", 0))
    transaction_time = float(data.get("time", 0))
    location_score = float(data.get("location_score", 50))
    transaction_frequency = float(data.get("frequency", 15))
    device_score = float(data.get("device_score", 50))
    threshold = float(data.get("threshold", 0.50))

    # Convert the UI fields into the 30 features expected by the model.
    features = [0.0] * 30
    features[0] = transaction_time
    features[1] = (location_score - 50) / 10
    features[2] = (device_score - 50) / 10
    features[3] = (transaction_frequency - 15) / 5
    features[4] = amount / 1000
    features[5] = (transaction_time - 10) / 10
    features[29] = amount

    input_data = pd.DataFrame([features], columns=FEATURE_NAMES)
    input_scaled = scaler.transform(input_data)
    fraud_probability = float(model.predict_proba(input_scaled)[0][1])

    prediction = "Fraud" if fraud_probability >= threshold else "Normal"

    return {
        "prediction": prediction,
        "fraud_probability": round(fraud_probability, 4),
        "fraud_probability_percentage": round(fraud_probability * 100, 2),
        "threshold": threshold,
    }


def calculate_metrics_for_threshold(threshold: float):
    predictions = (probabilities >= threshold).astype(int)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions, zero_division=0)
    recall = recall_score(y_test, predictions, zero_division=0)
    f1 = f1_score(y_test, predictions, zero_division=0)

    tn, fp, fn, tp = confusion_matrix(
        y_test, predictions, labels=[0, 1]
    ).ravel()

    return {
        "threshold": threshold,
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
        },
    }


@app.post("/metrics")
def calculate_metrics(data: dict):
    threshold = float(data.get("threshold", 0.5))
    return calculate_metrics_for_threshold(threshold)


@app.get("/threshold-metrics")
def threshold_metrics():
    thresholds = [round(i / 100, 2) for i in range(0, 101, 5)]
    return [
        {
            "threshold": item["threshold"],
            "accuracy": item["accuracy"],
            "precision": item["precision"],
            "recall": item["recall"],
            "f1_score": item["f1_score"],
        }
        for item in (calculate_metrics_for_threshold(t) for t in thresholds)
    ]
