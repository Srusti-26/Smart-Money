from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_collection
from bson import ObjectId
from datetime import datetime
import math

goals_bp = Blueprint("goals", __name__)

def serialize_goal(g):
    return {
        "id": str(g["_id"]),
        "name": g["name"],
        "target_amount": g["target_amount"],
        "current_amount": g.get("current_amount", 0),
        "deadline_months": g["deadline_months"],
        "monthly_savings_needed": g.get("monthly_savings_needed", 0),
        "created_at": g.get("created_at", ""),
        "priority": g.get("priority", "medium")
    }

@goals_bp.route("/", methods=["GET"])
@jwt_required()
def get_goals():
    user_id = get_jwt_identity()
    goals = get_collection("goals")
    results = list(goals.find({"user_id": ObjectId(user_id)}))
    return jsonify([serialize_goal(g) for g in results]), 200

@goals_bp.route("/", methods=["POST"])
@jwt_required()
def create_goal():
    user_id = get_jwt_identity()
    data = request.json
    goals = get_collection("goals")
    
    target = float(data["target_amount"])
    current = float(data.get("current_amount", 0))
    months = int(data["deadline_months"])
    monthly_needed = math.ceil((target - current) / months) if months > 0 else target - current
    
    goal = {
        "user_id": ObjectId(user_id),
        "name": data["name"],
        "target_amount": target,
        "current_amount": current,
        "deadline_months": months,
        "monthly_savings_needed": monthly_needed,
        "priority": data.get("priority", "medium"),
        "created_at": datetime.utcnow().isoformat()
    }
    result = goals.insert_one(goal)
    goal["_id"] = result.inserted_id
    return jsonify(serialize_goal(goal)), 201

@goals_bp.route("/<goal_id>", methods=["PUT"])
@jwt_required()
def update_goal(goal_id):
    user_id = get_jwt_identity()
    data = request.json
    goals = get_collection("goals")
    
    update_fields = {k: v for k, v in data.items() if k in ["name", "target_amount", "current_amount", "deadline_months", "priority"]}
    
    # Recalculate monthly savings
    goal = goals.find_one({"_id": ObjectId(goal_id)})
    if goal:
        target = float(update_fields.get("target_amount", goal["target_amount"]))
        current = float(update_fields.get("current_amount", goal.get("current_amount", 0)))
        months = int(update_fields.get("deadline_months", goal["deadline_months"]))
        update_fields["monthly_savings_needed"] = math.ceil((target - current) / months) if months > 0 else 0
    
    goals.update_one({"_id": ObjectId(goal_id), "user_id": ObjectId(user_id)}, {"$set": update_fields})
    goal = goals.find_one({"_id": ObjectId(goal_id)})
    return jsonify(serialize_goal(goal)), 200

@goals_bp.route("/<goal_id>", methods=["DELETE"])
@jwt_required()
def delete_goal(goal_id):
    user_id = get_jwt_identity()
    goals = get_collection("goals")
    goals.delete_one({"_id": ObjectId(goal_id), "user_id": ObjectId(user_id)})
    return jsonify({"message": "Goal deleted"}), 200
