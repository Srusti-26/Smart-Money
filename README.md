
# Smart Money

> A full-stack AI-powered financial assistant with ML-driven insights, expense prediction, anomaly detection, and personalized investment advice.
## 📷 Demo



![Smart Money demo](Demo/Recording%202026-04-03%20211145.gif)


## 🚀 Project Overview

Smart Money is a modern personal finance management platform combining:
- Flask backend API + MongoDB
- React frontend SPA
- ML modules for budget planning, forecasting, anomaly detection, and financial health scoring
- User authentication + secure JWT sessions

### Core features
- User signup/login/profile management
- Transaction CRUD with auto-categorization
- Recurring expense detection
- Monthly budget planning + status monitoring
- Financial goals CRUD + progress tracking
- AI insights, spending trends, and health score
- Expense prediction, anomaly alerts, and future savings simulation
- Rule-based investment suggestions by risk tier

## 🏗️ Tech Stack

| Layer | Technology |
|------|------------|
| Backend | Python, Flask, Flask-CORS, Flask-JWT-Extended |
| Database | MongoDB (via PyMongo) |
| ML | Numpy, Pandas, scikit-learn |
| Frontend | React, React Router, Axios, React Hot Toast |
| Deployment | Docker optional, Cloud (Render/Vercel/Netlify) |

## 📁 Repository Structure

```
smart-money/
  backend/        # Flask API, routes, ML models, DB utils
  frontend/       # React SPA pages + components
  docs/           # Additional docs and architecture overview
  Demo/           # Optional demo assets and media
  .gitignore
  LICENSE
  README.md       # this file
```

> Note: this folder is the project root to push to GitHub (`main` branch structure).

## 🛠️ Setup Instructions

### 1. Backend Setup

```bash
cd smart-money/backend
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux
```

Update `.env` with your MongoDB URI and any environment variables.

### 2. Seed sample data

```bash
python seed_data.py
```

### 3. Start backend server

```bash
python app.py
```

API status: `http://localhost:5000/api/health`

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

Optional: create `.env`:

```bash
REACT_APP_API_URL=http://localhost:5000
```

Start frontend:

```bash
npm start
```

UI: `http://localhost:3000`

## 🔌 API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

### Transactions
- `GET /api/transactions/`
- `POST /api/transactions/`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/transactions/summary`
- `GET /api/transactions/categories`
- `GET /api/transactions/recurring`

### Budget
- `GET /api/budget/`
- `POST /api/budget/`
- `GET /api/budget/status`

### Goals
- `GET /api/goals/`
- `POST /api/goals/`
- `PUT /api/goals/:id`
- `DELETE /api/goals/:id`

### ML/AI
- `POST /api/ml/categorize`
- `GET /api/ml/predict`
- `GET /api/ml/anomalies`
- `GET /api/ml/insights`
- `GET /api/ml/health-score`
- `GET /api/ml/simulate`
- `GET /api/ml/investments`


## 🛡️ License

This repo uses the proprietary license in `LICENSE`:
- Learning/evaluation only
- No redistribution
- No modification
- No commercial use

## 🧾 Quick start user (seed)
- Email: `srusti@example.com`
- Password: `password123`

## 📦 Branch / github setup

- Target repository: `https://github.com/Srusti-26/Smart-Money`
- Keep all content inside this `smart-money` folder as root for `main` branch.

## 🧹 Cleanup + check

- Ensure within `smart-money` folder: `.gitignore`, `LICENSE`, `README.md`, backend, frontend, docs.
- Add missing screenshots and demo resources under `docs/` or `Demo/`.

---

Maintainer: Srusti-26
