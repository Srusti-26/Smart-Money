from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

insights_bp = Blueprint("insights", __name__)

@insights_bp.route("/", methods=["GET"])
@jwt_required()
def get_insights():
    # Insights are served via /api/ml/insights
    return jsonify({"message": "Use /api/ml/insights for AI-powered insights"}), 200
