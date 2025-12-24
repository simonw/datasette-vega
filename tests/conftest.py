import os
import shutil
import subprocess
import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(ROOT, "datasette_vega", "static")


@pytest.fixture(scope="session")
def build_static_assets():
    """
    Session-scoped fixture that builds the React app and copies
    the static assets to the datasette_vega/static directory.

    This fixture runs npm install and npm run build, then moves
    the compiled JS and CSS files to the plugin's static directory.
    """
    # Check if static assets already exist (e.g., in CI where they're pre-built)
    js_files = list(
        f for f in os.listdir(STATIC_DIR) if f.endswith(".js")
    ) if os.path.exists(STATIC_DIR) else []

    if js_files:
        # Assets already built, skip
        yield STATIC_DIR
        return

    # Build the React app
    subprocess.check_call(["npm", "install"], cwd=ROOT)
    subprocess.check_call(["npm", "run", "build"], cwd=ROOT)

    # Create static directory if it doesn't exist
    os.makedirs(STATIC_DIR, exist_ok=True)

    # Move built assets to static directory
    build_js_dir = os.path.join(ROOT, "build", "static", "js")
    build_css_dir = os.path.join(ROOT, "build", "static", "css")

    for filename in os.listdir(build_js_dir):
        src = os.path.join(build_js_dir, filename)
        dst = os.path.join(STATIC_DIR, filename)
        shutil.copy2(src, dst)

    for filename in os.listdir(build_css_dir):
        src = os.path.join(build_css_dir, filename)
        dst = os.path.join(STATIC_DIR, filename)
        shutil.copy2(src, dst)

    yield STATIC_DIR
