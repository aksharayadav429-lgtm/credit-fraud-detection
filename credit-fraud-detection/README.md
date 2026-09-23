# Credit Card Fraud Detection

A FastAPI + HTML/CSS/JavaScript application for demonstrating credit-card fraud prediction with a trained Random Forest model.

## Project structure

```text
credit-fraud-detection/
├── backend/
│   ├── model/
│   │   ├── fraud_model.pkl
│   │   └── evaluation_data.pkl
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .gitignore
├── README.md
└── render.yaml
```

## Run locally

From the project root:

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r backend\requirements.txt
uvicorn backend.app:app --reload
```

Open `http://127.0.0.1:8000`.

## Render

Render can deploy the service using `render.yaml`. The FastAPI application serves the frontend and API from the same service, so no localhost API URL is required in production.

## Note about the dataset

The original `creditcard.csv` dataset is about 144 MB and is intentionally excluded from the GitHub/deployment package because GitHub's normal repository file limit is 100 MB. The deployment package contains the trained model and a compact precomputed evaluation dataset needed by the metrics endpoints.
