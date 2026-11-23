import os
import sys
import types

# Ensure 'backend' namespace is available even when deployed with root = 'backend'
if "backend" not in sys.modules:
    app_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(app_dir)
    parent_dir = os.path.dirname(backend_dir)
    if parent_dir and parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    pkg = types.ModuleType("backend")
    pkg.__path__ = [backend_dir]
    sys.modules["backend"] = pkg

    app_pkg = types.ModuleType("backend.app")
    app_pkg.__path__ = [app_dir]
    sys.modules["backend.app"] = app_pkg
    pkg.app = app_pkg

