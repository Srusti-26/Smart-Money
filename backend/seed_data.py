"""
Seed script to populate the database with sample data for testing.
Run: python seed_data.py
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
import bcrypt
import random
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "smart_money_db")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Clear existing data
db.users.drop()
db.transactions.drop()
db.budgets.drop()
db.goals.drop()

# Create test user
password = bcrypt.hashpw("password123".encode(), bcrypt.gensalt())
user = {
    "name": "Srusti",
    "email": "srusti@example.com",
    "password": password,
    "salary": 60000,
    "risk_level": "medium",
    "currency": "INR",
    "created_at": datetime.utcnow().isoformat()
}
user_id = db.users.insert_one(user).inserted_id

# Generate 4 months of transactions
categories_expense = {
    "Food": (2000, 8000),
    "Rent": (15000, 15000),
    "Travel": (1000, 4000),
    "Shopping": (2000, 6000),
    "Bills": (1500, 3000),
    "Entertainment": (500, 2000),
    "Healthcare": (0, 2000),
    "EMI": (5000, 5000),
}

transactions = []
now = datetime.utcnow()

for month_offset in range(4):
    month_date = now - timedelta(days=30 * month_offset)
    
    # Add salary
    transactions.append({
        "user_id": user_id,
        "amount": 60000.0,
        "category": "Salary",
        "date": month_date.replace(day=1).strftime("%Y-%m-%d"),
        "description": "Monthly Salary",
        "type": "income",
        "is_recurring": True,
        "created_at": datetime.utcnow().isoformat()
    })
    
    # Freelance income (random)
    if random.random() > 0.5:
        transactions.append({
            "user_id": user_id,
            "amount": float(random.randint(5000, 15000)),
            "category": "Salary",
            "date": month_date.replace(day=15).strftime("%Y-%m-%d"),
            "description": "Freelance Project Payment",
            "type": "income",
            "is_recurring": False,
            "created_at": datetime.utcnow().isoformat()
        })
    
    # Add expenses
    for cat, (min_amt, max_amt) in categories_expense.items():
        if min_amt == max_amt:
            amt = min_amt
        else:
            amt = random.randint(min_amt, max_amt)
        
        # Split into 2-4 transactions for food
        if cat == "Food":
            for _ in range(random.randint(8, 15)):
                day = random.randint(1, 28)
                food_items = ["Zomato Order", "Swiggy Order", "Restaurant Dinner", "Grocery Store", "Coffee Shop", "Lunch Meeting"]
                transactions.append({
                    "user_id": user_id,
                    "amount": float(random.randint(100, 600)),
                    "category": cat,
                    "date": month_date.replace(day=day).strftime("%Y-%m-%d"),
                    "description": random.choice(food_items),
                    "type": "expense",
                    "is_recurring": False,
                    "created_at": datetime.utcnow().isoformat()
                })
        else:
            if amt > 0:
                day = random.randint(1, 28)
                desc_map = {
                    "Rent": "Monthly Rent Payment",
                    "Travel": "Uber/Ola Rides",
                    "Shopping": "Online Shopping",
                    "Bills": "Electricity & Internet Bill",
                    "Entertainment": "Netflix & Streaming",
                    "Healthcare": "Medical Consultation",
                    "EMI": "Home Loan EMI",
                }
                transactions.append({
                    "user_id": user_id,
                    "amount": float(amt),
                    "category": cat,
                    "date": month_date.replace(day=day).strftime("%Y-%m-%d"),
                    "description": desc_map.get(cat, cat),
                    "type": "expense",
                    "is_recurring": cat in ["Rent", "EMI", "Entertainment"],
                    "created_at": datetime.utcnow().isoformat()
                })

db.transactions.insert_many(transactions)

# Create budget
db.budgets.insert_one({
    "user_id": user_id,
    "month": now.strftime("%m"),
    "year": now.strftime("%Y"),
    "total_budget": 45000.0,
    "category_budgets": {
        "Food": 8000,
        "Travel": 3000,
        "Shopping": 5000,
        "Bills": 3000,
        "Entertainment": 2000
    },
    "created_at": datetime.utcnow().isoformat()
})

# Create goals
goals = [
    {"name": "Emergency Fund", "target_amount": 180000, "current_amount": 30000, "deadline_months": 12, "priority": "high"},
    {"name": "Europe Vacation", "target_amount": 150000, "current_amount": 20000, "deadline_months": 18, "priority": "medium"},
    {"name": "New Laptop", "target_amount": 80000, "current_amount": 15000, "deadline_months": 6, "priority": "low"},
]

import math
for g in goals:
    g["user_id"] = user_id
    g["monthly_savings_needed"] = math.ceil((g["target_amount"] - g["current_amount"]) / g["deadline_months"])
    g["created_at"] = datetime.utcnow().isoformat()

db.goals.insert_many(goals)

print("✅ Database seeded successfully!")
print(f"📧 Login: srusti@example.com")
print(f"🔑 Password: password123")
print(f"💰 Salary: ₹60,000/month")
print(f"📊 {len(transactions)} transactions created across 4 months")
