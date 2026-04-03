from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_collection
from bson import ObjectId
from ml_models.models import (
    auto_categorize, predict_next_month_expense, detect_anomalies,
    generate_insights, calculate_health_score, simulate_future,
    get_investment_suggestions
)

ml_bp = Blueprint("ml", __name__)

def get_user_transactions(user_id):
    txs = get_collection("transactions")
    results = list(txs.find({"user_id": ObjectId(user_id)}))
    return [{
        "id": str(t["_id"]),
        "amount": t["amount"],
        "category": t["category"],
        "date": t["date"],
        "description": t["description"],
        "type": t["type"]
    } for t in results]

@ml_bp.route("/categorize", methods=["POST"])
@jwt_required()
def categorize():
    data = request.json
    description = data.get("description", "")
    category = auto_categorize(description)
    return jsonify({"category": category}), 200

@ml_bp.route("/predict", methods=["GET"])
@jwt_required()
def predict():
    user_id = get_jwt_identity()
    transactions = get_user_transactions(user_id)
    result = predict_next_month_expense(transactions)
    return jsonify(result), 200

@ml_bp.route("/anomalies", methods=["GET"])
@jwt_required()
def anomalies():
    user_id = get_jwt_identity()
    transactions = get_user_transactions(user_id)
    result = detect_anomalies(transactions)
    return jsonify(result), 200

@ml_bp.route("/insights", methods=["GET"])
@jwt_required()
def insights():
    user_id = get_jwt_identity()
    transactions = get_user_transactions(user_id)
    users = get_collection("users")
    user = users.find_one({"_id": ObjectId(user_id)})
    salary = user.get("salary", 0) if user else 0
    result = generate_insights(transactions, salary)
    return jsonify(result), 200

@ml_bp.route("/health-score", methods=["GET"])
@jwt_required()
def health_score():
    user_id = get_jwt_identity()
    transactions = get_user_transactions(user_id)
    users = get_collection("users")
    budgets = get_collection("budgets")
    
    user = users.find_one({"_id": ObjectId(user_id)})
    salary = user.get("salary", 0) if user else 0
    
    from datetime import datetime
    now = datetime.utcnow()
    budget = budgets.find_one({
        "user_id": ObjectId(user_id),
        "month": now.strftime("%m"),
        "year": now.strftime("%Y")
    })
    budget_data = {"total_budget": budget.get("total_budget", 0)} if budget else {}
    
    result = calculate_health_score(transactions, budget_data, salary)
    return jsonify(result), 200

@ml_bp.route("/simulate", methods=["GET"])
@jwt_required()
def simulate():
    user_id = get_jwt_identity()
    transactions = get_user_transactions(user_id)
    users = get_collection("users")
    user = users.find_one({"_id": ObjectId(user_id)})
    salary = user.get("salary", 0) if user else 0
    months = int(request.args.get("months", 12))
    result = simulate_future(transactions, salary, months)
    return jsonify(result), 200

@ml_bp.route("/investments", methods=["GET"])
@jwt_required()
def investments():
    user_id = get_jwt_identity()
    users = get_collection("users")
    user = users.find_one({"_id": ObjectId(user_id)})
    salary = user.get("salary", 0) if user else 0
    risk_level = user.get("risk_level", "medium") if user else "medium"
    
    transactions = get_user_transactions(user_id)
    sim = simulate_future(transactions, salary, 1)
    monthly_savings = sim.get("monthly_savings", 0)
    
    suggestions = get_investment_suggestions(monthly_savings, risk_level)
    return jsonify({"suggestions": suggestions, "monthly_savings": monthly_savings}), 200
