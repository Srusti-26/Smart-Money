from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_collection
from bson import ObjectId
from datetime import datetime

budget_bp = Blueprint("budget", __name__)

def serialize_budget(b):
    return {
        "id": str(b["_id"]),
        "user_id": str(b["user_id"]),
        "month": b["month"],
        "year": b["year"],
        "total_budget": b["total_budget"],
        "category_budgets": b.get("category_budgets", {}),
        "created_at": b.get("created_at", "")
    }

@budget_bp.route("/", methods=["GET"])
@jwt_required()
def get_budget():
    user_id = get_jwt_identity()
    budgets = get_collection("budgets")
    month = request.args.get("month", datetime.utcnow().strftime("%m"))
    year = request.args.get("year", datetime.utcnow().strftime("%Y"))
    budget = budgets.find_one({"user_id": ObjectId(user_id), "month": month, "year": year})
    if not budget:
        return jsonify(None), 200
    return jsonify(serialize_budget(budget)), 200

@budget_bp.route("/", methods=["POST"])
@jwt_required()
def set_budget():
    user_id = get_jwt_identity()
    data = request.json
    budgets = get_collection("budgets")
    month = data.get("month", datetime.utcnow().strftime("%m"))
    year = data.get("year", datetime.utcnow().strftime("%Y"))
    
    budget_doc = {
        "user_id": ObjectId(user_id),
        "month": month,
        "year": year,
        "total_budget": float(data["total_budget"]),
        "category_budgets": data.get("category_budgets", {}),
        "created_at": datetime.utcnow().isoformat()
    }
    budgets.update_one(
        {"user_id": ObjectId(user_id), "month": month, "year": year},
        {"$set": budget_doc},
        upsert=True
    )
    budget = budgets.find_one({"user_id": ObjectId(user_id), "month": month, "year": year})
    return jsonify(serialize_budget(budget)), 200

@budget_bp.route("/status", methods=["GET"])
@jwt_required()
def get_budget_status():
    user_id = get_jwt_identity()
    month = request.args.get("month", datetime.utcnow().strftime("%m"))
    year = request.args.get("year", datetime.utcnow().strftime("%Y"))
    
    budgets = get_collection("budgets")
    txs = get_collection("transactions")
    
    budget = budgets.find_one({"user_id": ObjectId(user_id), "month": month, "year": year})
    if not budget:
        return jsonify({"message": "No budget set"}), 200
    
    prefix = f"{year}-{month.zfill(2)}"
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "date": {"$regex": f"^{prefix}"}, "type": "expense"}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}}
    ]
    spent_by_cat = {r["_id"]: r["total"] for r in txs.aggregate(pipeline)}
    total_spent = sum(spent_by_cat.values())
    
    cat_status = {}
    for cat, cat_budget in budget.get("category_budgets", {}).items():
        spent = spent_by_cat.get(cat, 0)
        cat_status[cat] = {
            "budget": cat_budget,
            "spent": spent,
            "remaining": cat_budget - spent,
            "percentage": round((spent / cat_budget * 100) if cat_budget > 0 else 0, 1),
            "exceeded": spent > cat_budget
        }
    
    return jsonify({
        "total_budget": budget["total_budget"],
        "total_spent": total_spent,
        "remaining": budget["total_budget"] - total_spent,
        "percentage": round((total_spent / budget["total_budget"] * 100) if budget["total_budget"] > 0 else 0, 1),
        "exceeded": total_spent > budget["total_budget"],
        "category_status": cat_status
    }), 200
