"""
ML Models for Smart Money Management
- NLP Auto-categorizer
- Linear Regression Expense Predictor
- Anomaly Detection
- K-Means Clustering
- Financial Health Score
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import re
import math

# ─── CATEGORY KEYWORDS (NLP Rule-Based + Pattern Matching) ───────────────────

CATEGORY_KEYWORDS = {
    "Food": ["food", "restaurant", "cafe", "coffee", "lunch", "dinner", "breakfast", "eat",
             "pizza", "burger", "zomato", "swiggy", "grocery", "groceries", "vegetables",
             "milk", "bread", "snack", "tea", "juice", "hotel", "dhaba", "mess"],
    "Rent": ["rent", "housing", "apartment", "flat", "pg", "accommodation", "landlord", "lease"],
    "Travel": ["travel", "uber", "ola", "taxi", "bus", "train", "flight", "metro", "fuel",
               "petrol", "diesel", "toll", "parking", "rapido", "auto", "cab", "ticket"],
    "Shopping": ["shopping", "amazon", "flipkart", "myntra", "clothes", "shoes", "fashion",
                 "mall", "market", "buy", "purchase", "order", "delivery", "meesho", "ajio"],
    "Bills": ["bill", "electricity", "water", "gas", "internet", "wifi", "broadband", "phone",
              "mobile", "recharge", "dth", "cable", "insurance", "premium", "tax", "lic"],
    "Entertainment": ["movie", "cinema", "netflix", "spotify", "amazon prime", "hotstar",
                      "gaming", "game", "pub", "bar", "club", "party", "concert", "event"],
    "Healthcare": ["hospital", "doctor", "medicine", "pharmacy", "medical", "health", "clinic",
                   "lab", "test", "checkup", "dentist", "optician", "gym", "fitness"],
    "Education": ["course", "tuition", "fees", "book", "study", "school", "college", "udemy",
                  "coursera", "training", "workshop", "exam", "certification"],
    "EMI": ["emi", "loan", "credit card", "mortgage", "installment", "home loan", "car loan"],
    "Investment": ["invest", "sip", "mutual fund", "stock", "share", "fd", "fixed deposit",
                   "rd", "ppf", "nps", "crypto", "gold", "zerodha", "groww", "upstox"],
    "Salary": ["salary", "income", "wage", "stipend", "freelance", "payment received",
               "credited", "bonus", "incentive", "commission", "revenue"],
}

def auto_categorize(description: str) -> str:
    """NLP-based auto categorization using keyword matching + scoring"""
    if not description:
        return "Others"
    
    desc_lower = description.lower()
    scores = {}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in desc_lower:
                # Longer keyword matches get higher score
                score += len(kw.split()) * 2 if kw in desc_lower else 0
        if score > 0:
            scores[category] = score
    
    if scores:
        return max(scores, key=scores.get)
    return "Others"

# ─── EXPENSE PREDICTION (Linear Regression) ──────────────────────────────────

def predict_next_month_expense(transactions: list) -> dict:
    """Predict next month's expenses using linear regression on historical data"""
    if not transactions:
        return {"predicted": 0, "confidence": "low", "trend": "stable"}
    
    df = pd.DataFrame(transactions)
    df = df[df["type"] == "expense"].copy()
    
    if df.empty:
        return {"predicted": 0, "confidence": "low", "trend": "stable"}
    
    df["date"] = pd.to_datetime(df["date"])
    df["month_key"] = df["date"].dt.to_period("M")
    
    monthly = df.groupby("month_key")["amount"].sum().reset_index()
    monthly["month_idx"] = range(len(monthly))
    
    if len(monthly) < 2:
        avg = monthly["amount"].mean()
        return {"predicted": round(avg, 2), "confidence": "low", "trend": "stable", "monthly_data": monthly["amount"].tolist()}
    
    # Simple linear regression
    X = monthly["month_idx"].values.reshape(-1, 1)
    y = monthly["amount"].values
    
    n = len(X)
    x_mean = np.mean(X)
    y_mean = np.mean(y)
    
    numerator = sum((X[i][0] - x_mean) * (y[i] - y_mean) for i in range(n))
    denominator = sum((X[i][0] - x_mean) ** 2 for i in range(n))
    
    slope = numerator / denominator if denominator != 0 else 0
    intercept = y_mean - slope * x_mean
    
    next_idx = len(monthly)
    predicted = slope * next_idx + intercept
    predicted = max(predicted, 0)
    
    # Determine trend
    if slope > y_mean * 0.05:
        trend = "increasing"
    elif slope < -y_mean * 0.05:
        trend = "decreasing"
    else:
        trend = "stable"
    
    confidence = "high" if len(monthly) >= 4 else "medium" if len(monthly) >= 2 else "low"
    
    return {
        "predicted": round(predicted, 2),
        "confidence": confidence,
        "trend": trend,
        "slope": round(slope, 2),
        "monthly_data": monthly["amount"].tolist(),
        "months": [str(m) for m in monthly["month_key"].tolist()]
    }

# ─── ANOMALY DETECTION ────────────────────────────────────────────────────────

def detect_anomalies(transactions: list) -> list:
    """Detect unusual spending using Z-score and IQR methods"""
    if not transactions:
        return []
    
    df = pd.DataFrame(transactions)
    expenses = df[df["type"] == "expense"].copy()
    
    if expenses.empty or len(expenses) < 3:
        return []
    
    anomalies = []
    
    for category in expenses["category"].unique():
        cat_data = expenses[expenses["category"] == category]["amount"]
        if len(cat_data) < 2:
            continue
        
        mean = cat_data.mean()
        std = cat_data.std()
        
        if std == 0:
            continue
        
        for _, row in expenses[expenses["category"] == category].iterrows():
            z_score = abs((row["amount"] - mean) / std)
            if z_score > 2.0:
                pct_above = round((row["amount"] - mean) / mean * 100, 1)
                anomalies.append({
                    "transaction_id": str(row.get("id", "")),
                    "category": category,
                    "amount": row["amount"],
                    "date": row["date"],
                    "description": row.get("description", ""),
                    "z_score": round(z_score, 2),
                    "percentage_above_avg": pct_above,
                    "category_avg": round(mean, 2),
                    "severity": "high" if z_score > 3 else "medium"
                })
    
    return sorted(anomalies, key=lambda x: x["z_score"], reverse=True)

# ─── SPENDING INSIGHTS ────────────────────────────────────────────────────────

def generate_insights(transactions: list, user_salary: float = 0) -> list:
    """Generate natural language spending insights"""
    if not transactions:
        return []
    
    insights = []
    df = pd.DataFrame(transactions)
    expenses = df[df["type"] == "expense"].copy()
    
    if expenses.empty:
        return []
    
    expenses["date"] = pd.to_datetime(expenses["date"])
    now = pd.Timestamp.now()
    
    # Current and last month (year-aware)
    curr_period = now.to_period("M")
    prev_period = (now - pd.DateOffset(months=1)).to_period("M")
    
    curr_month = expenses[expenses["date"].dt.to_period("M") == curr_period]
    prev_month = expenses[expenses["date"].dt.to_period("M") == prev_period]
    
    # Month-over-month comparison
    if not curr_month.empty and not prev_month.empty:
        curr_total = curr_month["amount"].sum()
        prev_total = prev_month["amount"].sum()
        pct_change = round((curr_total - prev_total) / prev_total * 100, 1)
        
        if pct_change > 10:
            insights.append({
                "type": "warning",
                "icon": "📈",
                "title": "Spending Spike Detected",
                "message": f"Your expenses increased by {pct_change}% compared to last month (₹{curr_total:,.0f} vs ₹{prev_total:,.0f})."
            })
        elif pct_change < -10:
            insights.append({
                "type": "success",
                "icon": "📉",
                "title": "Great Savings Progress!",
                "message": f"You spent {abs(pct_change)}% less than last month. You saved an extra ₹{(prev_total - curr_total):,.0f}!"
            })
    
    # Category-wise analysis for current month
    if not curr_month.empty:
        cat_totals = curr_month.groupby("category")["amount"].sum()
        total_curr = cat_totals.sum()
        
        for cat, amt in cat_totals.items():
            pct = round(amt / total_curr * 100, 1)
            if pct > 40 and cat not in ["Rent", "EMI"]:
                insights.append({
                    "type": "alert",
                    "icon": "⚠️",
                    "title": f"High {cat} Spending",
                    "message": f"You spent {pct}% of your total expenses on {cat} (₹{amt:,.0f}). Consider reducing this."
                })
            
            # Compare category with last month
            if not prev_month.empty:
                prev_cat = prev_month[prev_month["category"] == cat]["amount"].sum()
                if prev_cat > 0:
                    cat_change = round((amt - prev_cat) / prev_cat * 100, 1)
                    if cat_change > 30:
                        insights.append({
                            "type": "warning",
                            "icon": "🔺",
                            "title": f"{cat} Up This Month",
                            "message": f"You spent {cat_change}% more on {cat} this month (₹{amt:,.0f} vs ₹{prev_cat:,.0f})."
                        })
    
    # Salary-based insights
    if user_salary > 0 and not curr_month.empty:
        curr_expense = curr_month["amount"].sum()
        income_txs = df[df["type"] == "income"].copy()
        income_txs["date"] = pd.to_datetime(income_txs["date"])
        curr_income = income_txs[income_txs["date"].dt.to_period("M") == curr_period]["amount"].sum()
        effective_income = max(curr_income, user_salary)
        savings_rate = round((effective_income - curr_expense) / effective_income * 100, 1)
        
        if savings_rate < 20:
            insights.append({
                "type": "alert",
                "icon": "💰",
                "title": "Low Savings Rate",
                "message": f"Your savings rate is {savings_rate}%. Aim for at least 20% to build a strong financial future."
            })
        elif savings_rate >= 30:
            insights.append({
                "type": "success",
                "icon": "🏆",
                "title": "Excellent Savings Rate!",
                "message": f"Your savings rate of {savings_rate}% is excellent. You're on track for financial independence!"
            })
    
    # Subscription detection
    recurring = _detect_subscriptions(df)
    if recurring:
        total_sub = sum(s["monthly_cost"] for s in recurring)
        insights.append({
            "type": "info",
            "icon": "🔄",
            "title": "Subscription Costs",
            "message": f"You have {len(recurring)} recurring payments totaling ~₹{total_sub:,.0f}/month. Review if all are necessary."
        })
    
    return insights[:8]  # Return top 8 insights

def _detect_subscriptions(df: pd.DataFrame) -> list:
    """Detect recurring subscription payments"""
    if df.empty:
        return []
    
    expenses = df[df["type"] == "expense"].copy()
    if expenses.empty:
        return []
    
    subscriptions = []
    expenses["date"] = pd.to_datetime(expenses["date"])
    # Drop rows with null descriptions to avoid NaN comparison crashes
    expenses = expenses.dropna(subset=["description"])
    expenses["description"] = expenses["description"].astype(str)
    
    # Group by similar amounts and descriptions
    for desc in expenses["description"].unique():
        if not desc or desc.lower() == "nan":
            continue
        similar = expenses[expenses["description"].str.lower() == desc.lower()]
        if len(similar) >= 2:
            months_diff = similar["date"].dt.to_period("M").nunique()
            if months_diff >= 2:
                avg_amount = similar["amount"].mean()
                subscriptions.append({
                    "description": desc,
                    "monthly_cost": round(avg_amount, 2),
                    "occurrences": len(similar),
                    "category": similar["category"].mode()[0] if not similar["category"].empty else "Others"
                })
    
    return subscriptions[:5]

# ─── FINANCIAL HEALTH SCORE ───────────────────────────────────────────────────

def calculate_health_score(transactions: list, budget: dict, salary: float) -> dict:
    """Calculate financial health score (0-100) with breakdown"""
    if not transactions:
        return {"score": 50, "grade": "C", "breakdown": {}}
    
    df = pd.DataFrame(transactions)
    now = pd.Timestamp.now()
    curr_month_exp = df[
        (df["type"] == "expense") & 
        (pd.to_datetime(df["date"]).dt.month == now.month)
    ]["amount"].sum()
    
    curr_month_inc = df[
        (df["type"] == "income") & 
        (pd.to_datetime(df["date"]).dt.month == now.month)
    ]["amount"].sum()
    
    effective_income = max(curr_month_inc, salary)
    score = 0
    breakdown = {}
    
    # 1. Savings Rate (30 points)
    if effective_income > 0:
        savings_rate = (effective_income - curr_month_exp) / effective_income
        sr_score = min(30, max(0, int(savings_rate * 100)))
        breakdown["savings_rate"] = {"score": sr_score, "max": 30, "value": f"{round(savings_rate*100,1)}%"}
        score += sr_score
    else:
        breakdown["savings_rate"] = {"score": 15, "max": 30, "value": "N/A"}
        score += 15
    
    # 2. Budget Discipline (25 points)
    if budget and budget.get("total_budget"):
        if curr_month_exp <= budget["total_budget"]:
            ratio = curr_month_exp / budget["total_budget"]
            bd_score = int(25 * (1 - max(0, ratio - 0.7) / 0.3))
            bd_score = max(15, bd_score)
        else:
            overspend_pct = (curr_month_exp - budget["total_budget"]) / budget["total_budget"]
            bd_score = max(0, int(25 * (1 - overspend_pct * 2)))
        breakdown["budget_discipline"] = {"score": bd_score, "max": 25, "value": f"₹{curr_month_exp:,.0f} spent"}
        score += bd_score
    else:
        breakdown["budget_discipline"] = {"score": 12, "max": 25, "value": "No budget set"}
        score += 12
    
    # 3. Spending Diversity (20 points) - not over-reliant on one category
    expenses = df[df["type"] == "expense"]
    if not expenses.empty:
        cat_totals = expenses.groupby("category")["amount"].sum()
        total = cat_totals.sum()
        max_pct = cat_totals.max() / total if total > 0 else 1
        diversity_score = int(20 * (1 - max(0, max_pct - 0.3) / 0.7))
        diversity_score = max(5, diversity_score)
        breakdown["spending_diversity"] = {"score": diversity_score, "max": 20, "value": f"{round(max_pct*100)}% on top category"}
        score += diversity_score
    else:
        breakdown["spending_diversity"] = {"score": 10, "max": 20, "value": "No data"}
        score += 10
    
    # 4. Consistency (25 points) - regular income tracking
    income_months = len(df[df["type"] == "income"]["date"].apply(lambda d: pd.to_datetime(d).strftime("%Y-%m")).unique())
    expense_months = len(df[df["type"] == "expense"]["date"].apply(lambda d: pd.to_datetime(d).strftime("%Y-%m")).unique())
    consistency_score = min(25, max(0, (income_months + expense_months) * 3))
    breakdown["consistency"] = {"score": consistency_score, "max": 25, "value": f"{expense_months} months tracked"}
    score += consistency_score
    
    score = min(100, max(0, score))
    
    if score >= 80:
        grade = "A"
    elif score >= 65:
        grade = "B"
    elif score >= 50:
        grade = "C"
    elif score >= 35:
        grade = "D"
    else:
        grade = "F"
    
    return {"score": score, "grade": grade, "breakdown": breakdown}

# ─── FUTURE SIMULATION ────────────────────────────────────────────────────────

def simulate_future(transactions: list, salary: float, months: int = 12) -> dict:
    """Simulate future savings under current vs optimized habits"""
    if not transactions:
        return {}
    
    df = pd.DataFrame(transactions)
    expenses = df[df["type"] == "expense"]
    income_txs = df[df["type"] == "income"]
    
    avg_monthly_expense = 0
    avg_monthly_income = 0
    
    if not expenses.empty:
        expenses_copy = expenses.copy()
        expenses_copy["month"] = pd.to_datetime(expenses_copy["date"]).dt.to_period("M")
        avg_monthly_expense = expenses_copy.groupby("month")["amount"].sum().mean()
    
    if not income_txs.empty:
        income_copy = income_txs.copy()
        income_copy["month"] = pd.to_datetime(income_copy["date"]).dt.to_period("M")
        avg_monthly_income = income_copy.groupby("month")["amount"].sum().mean()
    
    effective_income = max(avg_monthly_income, salary)
    monthly_savings = effective_income - avg_monthly_expense
    
    # Projection 1: Current habits
    current_projection = [round(monthly_savings * i, 2) for i in range(1, months + 1)]
    
    # Projection 2: Reduce spending by 20%
    reduced_expense = avg_monthly_expense * 0.8
    improved_savings = effective_income - reduced_expense
    improved_projection = [round(improved_savings * i, 2) for i in range(1, months + 1)]
    
    # Projection 3: Aggressive saving (30% reduction)
    aggressive_expense = avg_monthly_expense * 0.7
    aggressive_savings = effective_income - aggressive_expense
    aggressive_projection = [round(aggressive_savings * i, 2) for i in range(1, months + 1)]
    
    return {
        "monthly_income": round(effective_income, 2),
        "monthly_expense": round(avg_monthly_expense, 2),
        "monthly_savings": round(monthly_savings, 2),
        "savings_rate": round((monthly_savings / effective_income * 100) if effective_income > 0 else 0, 1),
        "current_projection": current_projection,
        "improved_projection": improved_projection,
        "aggressive_projection": aggressive_projection,
        "months": list(range(1, months + 1))
    }

# ─── INVESTMENT SUGGESTIONS ───────────────────────────────────────────────────

def get_investment_suggestions(monthly_savings: float, risk_level: str = "medium") -> list:
    """Rule-based investment suggestions based on savings and risk appetite"""
    if monthly_savings <= 0:
        return [{"type": "emergency", "name": "Build Emergency Fund First", "description": "Focus on cutting expenses before investing", "allocation": 0}]
    
    suggestions = []
    
    if risk_level == "low":
        suggestions = [
            {"type": "safe", "name": "Fixed Deposit (FD)", "description": "6-7% returns, fully safe. Ideal for capital preservation.", "allocation": 40, "amount": round(monthly_savings * 0.4)},
            {"type": "safe", "name": "PPF (Public Provident Fund)", "description": "7.1% tax-free returns, 15-year lock-in. Best for long-term safety.", "allocation": 30, "amount": round(monthly_savings * 0.3)},
            {"type": "moderate", "name": "Debt Mutual Funds", "description": "7-8% returns with moderate liquidity.", "allocation": 20, "amount": round(monthly_savings * 0.2)},
            {"type": "safe", "name": "Emergency Fund (Liquid Fund)", "description": "Keep 6 months of expenses in liquid/savings account.", "allocation": 10, "amount": round(monthly_savings * 0.1)},
        ]
    elif risk_level == "high":
        suggestions = [
            {"type": "aggressive", "name": "Equity Mutual Funds (SIP)", "description": "12-15% long-term returns. Best for wealth creation.", "allocation": 50, "amount": round(monthly_savings * 0.5)},
            {"type": "aggressive", "name": "Direct Stocks", "description": "High risk, high reward. Diversify across sectors.", "allocation": 20, "amount": round(monthly_savings * 0.2)},
            {"type": "moderate", "name": "Index Funds (Nifty 50)", "description": "Market returns with low cost. Set and forget.", "allocation": 20, "amount": round(monthly_savings * 0.2)},
            {"type": "safe", "name": "Gold ETF", "description": "Hedge against inflation. 5-8% long-term returns.", "allocation": 10, "amount": round(monthly_savings * 0.1)},
        ]
    else:  # medium
        suggestions = [
            {"type": "moderate", "name": "SIP in Equity Funds", "description": "Best for 5+ year horizon. Expected 10-12% returns.", "allocation": 40, "amount": round(monthly_savings * 0.4)},
            {"type": "safe", "name": "PPF / NPS", "description": "Tax-saving, government-backed with good returns.", "allocation": 25, "amount": round(monthly_savings * 0.25)},
            {"type": "moderate", "name": "Debt Funds / FD", "description": "Stability for your portfolio, 6-8% returns.", "allocation": 20, "amount": round(monthly_savings * 0.2)},
            {"type": "safe", "name": "Emergency Liquid Fund", "description": "Keep accessible, at least 3-6 months of expenses.", "allocation": 15, "amount": round(monthly_savings * 0.15)},
        ]
    
    return suggestions
