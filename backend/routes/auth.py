from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from utils.db import get_collection
import bcrypt
from datetime import datetime
from bson import ObjectId

auth_bp = Blueprint("auth", __name__)

def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "salary": user.get("salary", 0),
        "risk_level": user.get("risk_level", "medium"),
        "currency": user.get("currency", "INR"),
        "created_at": user.get("created_at", "")
    }

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    users = get_collection("users")

    if users.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())
    user = {
        "name": data["name"],
        "email": data["email"],
        "password": hashed,
        "salary": data.get("salary", 0),
        "risk_level": data.get("risk_level", "medium"),
        "currency": data.get("currency", "INR"),
        "created_at": datetime.utcnow().isoformat()
    }
    result = users.insert_one(user)
    user["_id"] = result.inserted_id
    token = create_access_token(identity=str(result.inserted_id))
    return jsonify({"token": token, "user": serialize_user(user)}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    users = get_collection("users")
    user = users.find_one({"email": data["email"]})

    if not user or not bcrypt.checkpw(data["password"].encode(), user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({"token": token, "user": serialize_user(user)}), 200

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    users = get_collection("users")
    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(serialize_user(user)), 200

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.json
    users = get_collection("users")
    update_fields = {k: v for k, v in data.items() if k in ["name", "salary", "risk_level", "currency"]}
    users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    user = users.find_one({"_id": ObjectId(user_id)})
    return jsonify(serialize_user(user)), 200
