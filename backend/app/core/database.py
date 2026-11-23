import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.core.config import settings
from backend.app.core.logging import logger

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    HAS_MOTOR = True
except ImportError:
    HAS_MOTOR = False


import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.core.config import settings
from backend.app.core.logging import logger

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    HAS_MOTOR = True
except ImportError:
    HAS_MOTOR = False


class InMemoryCollection:
    """Persistent local JSON file collection mimicking MongoDB collection interface for local fallback."""
    def __init__(self, name: str):
        self.name = name
        self._data: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            self._file_path = f"/tmp/vidoqra_db_{name}.json"
        else:
            self._file_path = os.path.abspath(os.path.join(settings.LOCAL_STORAGE_DIR, f"../db_{name}.json"))
        self._load_from_disk()

    def _load_from_disk(self):
        try:
            if os.path.exists(self._file_path):
                with open(self._file_path, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load local db file {self._file_path}: {e}")
            self._data = {}

    def _save_to_disk(self):
        try:
            os.makedirs(os.path.dirname(self._file_path), exist_ok=True)
            with open(self._file_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save local db file {self._file_path}: {e}")

    async def insert_one(self, doc: Dict[str, Any]):
        async with self._lock:
            doc_id = doc.get("jobId") or doc.get("downloadId") or str(len(self._data) + 1)
            doc_copy = dict(doc)
            if "_id" not in doc_copy:
                doc_copy["_id"] = doc_id
            self._data[doc_id] = doc_copy
            self._save_to_disk()
            return type("InsertResult", (), {"inserted_id": doc_id})()

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self._lock:
            for item in self._data.values():
                matches = True
                for k, v in query.items():
                    if item.get(k) != v:
                        matches = False
                        break
                if matches:
                    return dict(item)
            return None

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        async with self._lock:
            for item in self._data.values():
                matches = True
                for k, v in query.items():
                    if item.get(k) != v:
                        matches = False
                        break
                if matches:
                    if "$set" in update:
                        item.update(update["$set"])
                    self._save_to_disk()
                    return type("UpdateResult", (), {"modified_count": 1})()
            return type("UpdateResult", (), {"modified_count": 0})()

    def find(self, query: Optional[Dict[str, Any]] = None):
        return InMemoryCursor(list(self._data.values()), query or {})

    async def delete_one(self, query: Dict[str, Any]):
        async with self._lock:
            key_to_delete = None
            for key, item in self._data.items():
                matches = True
                for k, v in query.items():
                    if item.get(k) != v:
                        matches = False
                        break
                if matches:
                    key_to_delete = key
                    break
            if key_to_delete:
                del self._data[key_to_delete]
                self._save_to_disk()
                return type("DeleteResult", (), {"deleted_count": 1})()
            return type("DeleteResult", (), {"deleted_count": 0})()


class InMemoryCursor:
    def __init__(self, data: List[Dict[str, Any]], query: Dict[str, Any]):
        self._items = []
        for item in data:
            matches = True
            for k, v in query.items():
                if item.get(k) != v:
                    matches = False
                    break
            if matches:
                self._items.append(dict(item))
        self._skip = 0
        self._limit = len(self._items)
        self._sort_key = None
        self._sort_dir = 1

    def sort(self, key_or_list, direction: int = 1):
        if isinstance(key_or_list, list):
            self._sort_key = key_or_list[0][0]
            self._sort_dir = key_or_list[0][1]
        else:
            self._sort_key = key_or_list
            self._sort_dir = direction
        return self

    def skip(self, count: int):
        self._skip = count
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        res = self._items
        if self._sort_key:
            res = sorted(
                res,
                key=lambda x: str(x.get(self._sort_key, "")),
                reverse=(self._sort_dir == -1)
            )
        start = self._skip
        end = start + (length if length is not None else self._limit)
        return res[start:end]


class Database:
    def __init__(self):
        self.client: Optional[Any] = None
        self.db: Optional[Any] = None
        self.is_connected: bool = False
        self.is_fallback: bool = False
        self._fallback_collections: Dict[str, InMemoryCollection] = {}

    async def connect(self):
        if settings.MONGODB_URI and HAS_MOTOR:
            try:
                self.client = AsyncIOMotorClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=2000
                )
                # Test connection with timeout
                await asyncio.wait_for(self.client.admin.command('ping'), timeout=2.0)
                self.db = self.client[settings.MONGODB_DATABASE]
                self.is_connected = True
                self.is_fallback = False
                logger.info("Connected to MongoDB successfully.")
                return
            except Exception as e:
                logger.warning(f"Could not connect to MongoDB Atlas ({e}). Switching to robust local in-memory fallback.")
                self.is_fallback = True
        else:
            logger.info("MongoDB URI not specified or motor not installed. Running with local document store fallback.")
            self.is_fallback = True

    def get_collection(self, name: str):
        if self.is_connected and not self.is_fallback and self.db is not None:
            return self.db[name]
        if name not in self._fallback_collections:
            self._fallback_collections[name] = InMemoryCollection(name)
        return self._fallback_collections[name]

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")


db = Database()

