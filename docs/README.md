# 💰 Smart Money — AI-Based Financial Management System

> A full-stack AI-powered financial assistant with ML-driven insights, expense prediction, anomaly detection, and personalized investment advice.

---

## 🏗️ Project Architecture

```
smart-money/
├── backend/                  # Flask REST API
│   ├── app.py                # App entry point & route registration
│   ├── requirements.txt      # Python dependencies
│   ├── seed_data.py          # Database seeder with sample data
│   ├── .env.example          # Environment variables template
│   ├── routes/
│   │   ├── auth.py           # JWT authentication (signup/login/profile)
│   │   ├── transactions.py   # CRUD + summary + recurring detection
│   │   ├── budget.py         # Budget set/get + status tracking
│   │   ├── goals.py          # Financial goals CRUD
│   │   ├── insights.py       # (extensible insights route)
│   │   └── ml_routes.py      # All ML endpoints
│   ├── ml_models/
│   │   └── models.py         # All ML/AI logic (see ML section)
│   └── utils/
│       └── db.py             # MongoDB connection singleton
│
├── frontend/                 # React.js SPA
│   ├── public/index.html
│   ├── package.json
│   └── src/
│       ├── App.js            # Router + auth guards
│       ├── index.js          # React entry point
│       ├── index.css         # Global design system (CSS variables)
│       ├── context/
│       │   └── AuthContext.js # Global auth state
│       ├── utils/
│       │   └── api.js        # Axios instance + helpers
│       ├── components/
│       │   └── AppLayout.js  # Sidebar + layout shell
│       └── pages/
│           ├── Login.js       # Auth login
│           ├── Signup.js      # Auth signup
│           ├── Dashboard.js   # Main overview + charts
│           ├── Transactions.js # Full CRUD + AI categorize
│           ├── Budget.js      # Budget planner + tracking
│           ├── Goals.js       # Financial goal planning
│           ├── Insights.js    # AI insights + simulation
│           └── Investments.js # Investment suggestions
│
└── docs/
    └── README.md             # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

---

### Step 1: Clone & Setup Backend

```bash
cd smart-money/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Linux/Mac
# or: venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI if needed
```

### Step 2: Seed the Database

```bash
# Make sure MongoDB is running, then:
python seed_data.py
```

This creates:
- Test user: `rahul@example.com` / `password123`
- 4 months of realistic transaction data
- Budget and financial goals

### Step 3: Run the Backend

```bash
python app.py
# API running at http://localhost:5000
```

Test it: `curl http://localhost:5000/api/health`

---

### Step 4: Setup & Run Frontend

```bash
cd smart-money/frontend

npm install

# Optional: create .env file
echo "REACT_APP_API_URL=http://localhost:5000" > .env

npm start
# App running at http://localhost:3000
```

---

## 🤖 ML Features Explained

### 1. Auto-Categorization (NLP)
- **File**: `ml_models/models.py → auto_categorize()`
- **Method**: Rule-based NLP with keyword scoring
- **How it works**: Matches description against category keyword dictionaries, scores by keyword length & frequency, returns best match
- **Endpoint**: `POST /api/ml/categorize`

### 2. Expense Prediction (Linear Regression)
- **File**: `ml_models/models.py → predict_next_month_expense()`
- **Method**: Manual linear regression (no sklearn needed, pure numpy)
- **How it works**: Groups transactions by month, fits slope/intercept, predicts next month
- **Endpoint**: `GET /api/ml/predict`

### 3. Anomaly Detection (Z-Score)
- **File**: `ml_models/models.py → detect_anomalies()`
- **Method**: Statistical Z-score (>2σ = anomaly)
- **How it works**: Per-category mean/std calculation, flags transactions > 2 standard deviations above average
- **Endpoint**: `GET /api/ml/anomalies`

### 4. Spending Insights Engine
- **File**: `ml_models/models.py → generate_insights()`
- **Method**: Pattern detection + comparative analysis
- **Generates**: MoM comparisons, category alerts, savings rate warnings, subscription detection
- **Endpoint**: `GET /api/ml/insights`

### 5. Financial Health Score
- **File**: `ml_models/models.py → calculate_health_score()`
- **Method**: Weighted multi-factor scoring (0-100)
- **Factors**: Savings rate (30pts), Budget discipline (25pts), Spending diversity (20pts), Consistency (25pts)
- **Grades**: A (80+), B (65+), C (50+), D (35+), F (<35)
- **Endpoint**: `GET /api/ml/health-score`

### 6. Future Simulation
- **File**: `ml_models/models.py → simulate_future()`
- **Method**: Extrapolation with 3 scenarios
- **Scenarios**: Current habits / Reduce 20% / Aggressive 30% reduction
- **Endpoint**: `GET /api/ml/simulate`

### 7. Investment Suggestions (Rule-Based)
- **File**: `ml_models/models.py → get_investment_suggestions()`
- **Method**: Rule-based portfolio allocation by risk level
- **Risk Profiles**: Low (FD/PPF heavy), Medium (SIP + PPF), High (Equity heavy)
- **Endpoint**: `GET /api/ml/investments`

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/` | List transactions (filterable) |
| POST | `/api/transactions/` | Add transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Monthly summary |
| GET | `/api/transactions/categories` | List all categories |
| GET | `/api/transactions/recurring` | List recurring payments |

### Budget
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget/` | Get budget for month |
| POST | `/api/budget/` | Set/update budget |
| GET | `/api/budget/status` | Spending vs budget status |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals/` | List all goals |
| POST | `/api/goals/` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |

### ML/AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/categorize` | Auto-categorize description |
| GET | `/api/ml/predict` | Predict next month expenses |
| GET | `/api/ml/anomalies` | Detect unusual spending |
| GET | `/api/ml/insights` | Get AI insights |
| GET | `/api/ml/health-score` | Financial health score |
| GET | `/api/ml/simulate` | Future savings simulation |
| GET | `/api/ml/investments` | Investment suggestions |

---

## 📊 Sample API Requests

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rahul@example.com","password":"password123"}'

# Get monthly summary (with JWT)
curl http://localhost:5000/api/transactions/summary?month=01&year=2025 \
  -H "Authorization: Bearer <your_token>"

# Auto-categorize
curl -X POST http://localhost:5000/api/ml/categorize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"description":"Zomato order biryani"}'
# → {"category": "Food"}
```

---

## 🎨 Design System

The app uses a dark-mode-first design with CSS variables:

```css
--bg-primary: #0a0e1a     /* Page background */
--bg-card: #141c30        /* Card background */
--accent-blue: #4f8eff    /* Primary actions */
--accent-green: #22d3a5   /* Income / success */
--accent-red: #ef4444     /* Expense / danger */
--accent-amber: #f59e0b   /* Warnings */
--font: 'Sora'            /* Display font */
--font-mono: 'JetBrains Mono' /* Numbers */
```

---

## 🔧 Extending the System

### Add a new ML model
1. Add the function to `backend/ml_models/models.py`
2. Add a route in `backend/routes/ml_routes.py`
3. Call the API from the React frontend

### Add a new page
1. Create `frontend/src/pages/NewPage.js`
2. Add to `App.js` routes
3. Add nav item to `AppLayout.js`

### Add a new category
1. Update `CATEGORIES` in `backend/routes/transactions.py`
2. Update `CATEGORY_KEYWORDS` in `backend/ml_models/models.py`
3. Update `CATEGORIES`, `CATEGORY_COLORS`, `CATEGORY_ICONS` in `frontend/src/utils/api.js`

---

## 🚢 Deployment

### Backend (Render/Railway/Heroku)
```bash
# Add to requirements.txt: gunicorn
pip install gunicorn

# Procfile:
echo "web: gunicorn app:app" > Procfile
```

### Frontend (Vercel/Netlify)
```bash
# Build
npm run build

# Set env var:
REACT_APP_API_URL=https://your-backend.onrender.com
```

### MongoDB Atlas
Replace `.env` MONGO_URI with Atlas connection string.

---

## 📝 Test Credentials

```
Email:    rahul@example.com
Password: password123
Salary:   ₹60,000/month
Data:     4 months of transactions
```

> For the final GitHub repository, refer to the project root `README.md` for installation and maintenance details.

---

*Built with ❤️ using Flask, React, MongoDB, and Python ML*
