import os
import sys
import types

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Handle module resolution when deployed with Root Directory = 'backend'
if "backend" not in sys.modules:
    pkg = types.ModuleType("backend")
    pkg.__path__ = [backend_dir]
    sys.modules["backend"] = pkg
    try:
        import app
        pkg.app = app
        sys.modules["backend.app"] = app
    except ImportError:
        pass

from backend.app.main import app

# Vercel ASGI/WSGI entry point
handler = app
app = app
