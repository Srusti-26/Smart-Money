from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from datetime import timedelta
import os

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "smart-money-secret-2024")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

jwt = JWTManager(app)

from routes.auth import auth_bp
from routes.transactions import transactions_bp
from routes.budget import budget_bp
from routes.insights import insights_bp
from routes.goals import goals_bp
from routes.ml_routes import ml_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(transactions_bp, url_prefix="/api/transactions")
app.register_blueprint(budget_bp, url_prefix="/api/budget")
app.register_blueprint(insights_bp, url_prefix="/api/insights")
app.register_blueprint(goals_bp, url_prefix="/api/goals")
app.register_blueprint(ml_bp, url_prefix="/api/ml")

@app.route("/api/health")
def health():
    return {"status": "ok", "message": "Smart Money API is running"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
