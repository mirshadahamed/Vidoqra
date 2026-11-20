import os
import sys
import types

current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parent_dir = os.path.dirname(current_dir)

if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# If deployed with Vercel Root Directory = 'backend', alias 'backend' to current_dir
if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [current_dir]
    sys.modules["backend"] = backend_pkg

from backend.app.main import app

# Vercel Serverless Function entry point
app = app
