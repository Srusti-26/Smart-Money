from pymongo import MongoClient
import os

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        _client = MongoClient(mongo_uri)
        _db = _client[os.getenv("DB_NAME", "smart_money_db")]
    return _db

def get_collection(name):
    return get_db()[name]
