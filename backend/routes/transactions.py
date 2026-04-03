from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_collection
from bson import ObjectId
from datetime import datetime
import re

transactions_bp = Blueprint("transactions", __name__)

CATEGORIES = ["Food", "Rent", "Travel", "Shopping", "Bills", "Entertainment", "Healthcare", "Education", "EMI", "Investment", "Salary", "Others"]

def serialize_tx(tx):
    return {
        "id": str(tx["_id"]),
        "user_id": str(tx["user_id"]),
        "amount": tx["amount"],
        "category": tx["category"],
        "date": tx["date"],
        "description": tx["description"],
        "type": tx["type"],
        "is_recurring": tx.get("is_recurring", False),
        "created_at": tx.get("created_at", "")
    }

@transactions_bp.route("/", methods=["GET"])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    txs = get_collection("transactions")
    
    filters = {"user_id": ObjectId(user_id)}
    
    month = request.args.get("month")
    year = request.args.get("year")
    category = request.args.get("category")
    tx_type = request.args.get("type")
    
    if month and year:
        # Filter by month/year using string prefix match
        prefix = f"{year}-{month.zfill(2)}"
        filters["date"] = {"$regex": f"^{prefix}"}
    elif year:
        filters["date"] = {"$regex": f"^{year}"}
    
    if category:
        filters["category"] = category
    if tx_type:
        filters["type"] = tx_type
    
    results = list(txs.find(filters).sort("date", -1))
    return jsonify([serialize_tx(t) for t in results]), 200

@transactions_bp.route("/", methods=["POST"])
@jwt_required()
def add_transaction():
    user_id = get_jwt_identity()
    data = request.json
    txs = get_collection("transactions")
    
    tx = {
        "user_id": ObjectId(user_id),
        "amount": float(data["amount"]),
        "category": data.get("category", "Others"),
        "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "description": data.get("description", ""),
        "type": data.get("type", "expense"),
        "is_recurring": data.get("is_recurring", False),
        "created_at": datetime.utcnow().isoformat()
    }
    result = txs.insert_one(tx)
    tx["_id"] = result.inserted_id
    return jsonify(serialize_tx(tx)), 201

@transactions_bp.route("/<tx_id>", methods=["PUT"])
@jwt_required()
def update_transaction(tx_id):
    user_id = get_jwt_identity()
    data = request.json
    txs = get_collection("transactions")
    
    update_fields = {k: v for k, v in data.items() if k in ["amount", "category", "date", "description", "type", "is_recurring"]}
    if "amount" in update_fields:
        update_fields["amount"] = float(update_fields["amount"])
    
    result = txs.update_one(
        {"_id": ObjectId(tx_id), "user_id": ObjectId(user_id)},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Transaction not found"}), 404
    tx = txs.find_one({"_id": ObjectId(tx_id)})
    return jsonify(serialize_tx(tx)), 200

@transactions_bp.route("/<tx_id>", methods=["DELETE"])
@jwt_required()
def delete_transaction(tx_id):
    user_id = get_jwt_identity()
    txs = get_collection("transactions")
    txs.delete_one({"_id": ObjectId(tx_id), "user_id": ObjectId(user_id)})
    return jsonify({"message": "Transaction deleted"}), 200

@transactions_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()
    txs = get_collection("transactions")
    
    month = request.args.get("month", datetime.utcnow().strftime("%m"))
    year = request.args.get("year", datetime.utcnow().strftime("%Y"))
    prefix = f"{year}-{month.zfill(2)}"
    
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "date": {"$regex": f"^{prefix}"}}},
        {"$group": {
            "_id": {"type": "$type", "category": "$category"},
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = list(txs.aggregate(pipeline))
    
    summary = {"income": 0, "expense": 0, "by_category": {}, "count": 0}
    for r in results:
        t = r["_id"]["type"]
        cat = r["_id"]["category"]
        if t == "income":
            summary["income"] += r["total"]
        else:
            summary["expense"] += r["total"]
            summary["by_category"][cat] = summary["by_category"].get(cat, 0) + r["total"]
        summary["count"] += r["count"]
    
    summary["savings"] = summary["income"] - summary["expense"]
    summary["savings_rate"] = round((summary["savings"] / summary["income"] * 100) if summary["income"] > 0 else 0, 1)
    return jsonify(summary), 200

@transactions_bp.route("/categories", methods=["GET"])
def get_categories():
    return jsonify(CATEGORIES), 200

@transactions_bp.route("/recurring", methods=["GET"])
@jwt_required()
def get_recurring():
    user_id = get_jwt_identity()
    txs = get_collection("transactions")
    results = list(txs.find({"user_id": ObjectId(user_id), "is_recurring": True}).sort("date", -1))
    return jsonify([serialize_tx(t) for t in results]), 200
