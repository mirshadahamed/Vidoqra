import os
import sys
import types

current_dir = os.path.dirname(os.path.abspath(__file__)) # .../backend/api
backend_dir = os.path.dirname(current_dir)               # .../backend
repo_root = os.path.dirname(backend_dir)                 # .../VIDoqRA

for p in [repo_root, backend_dir]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

# Handle module resolution when deployed with Root Directory = 'backend'
if "backend" not in sys.modules:
    pkg = types.ModuleType("backend")
    pkg.__path__ = [backend_dir]
    sys.modules["backend"] = pkg
    try:
        from app import main as app_main
        app_pkg = types.ModuleType("backend.app")
        app_pkg.__path__ = [os.path.join(backend_dir, "app")]
        sys.modules["backend.app"] = app_pkg
        pkg.app = app_pkg
    except ImportError:
        pass

try:
    from backend.app.main import app
except ImportError:
    from app.main import app

# Vercel ASGI / WSGI entry points
handler = app
