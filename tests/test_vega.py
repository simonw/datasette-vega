import os
import pytest
import shutil
import sqlite3
import tempfile
from datasette.app import Datasette


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(ROOT, "datasette_vega", "static")


@pytest.fixture
def ds_instance(build_static_assets):
    """
    Function-scoped Datasette instance with a test database.
    Depends on build_static_assets to ensure assets are compiled.
    """
    # Create a temporary database with test data
    tmp_dir = tempfile.mkdtemp()
    db_path = os.path.join(tmp_dir, "test.db")

    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE test_data (
            id INTEGER PRIMARY KEY,
            name TEXT,
            value REAL,
            category TEXT
        )
    """)
    # Insert some test data for charting
    test_rows = [
        (1, "Alpha", 10.5, "A"),
        (2, "Beta", 20.3, "B"),
        (3, "Gamma", 15.7, "A"),
        (4, "Delta", 25.1, "B"),
        (5, "Epsilon", 30.2, "A"),
        (6, "Zeta", 12.8, "C"),
        (7, "Eta", 18.4, "C"),
        (8, "Theta", 22.6, "A"),
        (9, "Iota", 28.9, "B"),
        (10, "Kappa", 35.0, "C"),
    ]
    conn.executemany(
        "INSERT INTO test_data (id, name, value, category) VALUES (?, ?, ?, ?)",
        test_rows
    )
    conn.commit()
    conn.close()

    datasette = Datasette([db_path])
    yield datasette

    # Cleanup
    shutil.rmtree(tmp_dir, ignore_errors=True)


@pytest.mark.asyncio
async def test_plugin_is_installed(build_static_assets):
    ds = Datasette([], memory=True)
    response = await ds.client.get("/-/plugins.json")
    assert response.status_code == 200
    installed_plugins = {p["name"] for p in response.json()}
    assert "datasette-vega" in installed_plugins


@pytest.mark.asyncio
async def test_static_assets_are_served(ds_instance):
    """Test that the static JS and CSS assets are served correctly."""
    # Get the table page to check for CSS/JS URLs
    response = await ds_instance.client.get("/test/test_data")
    assert response.status_code == 200

    html = response.text
    # Check that CSS and JS are included
    assert "/-/static-plugins/datasette_vega/" in html
    assert ".css" in html
    assert ".js" in html


@pytest.mark.asyncio
async def test_static_plugin_files_accessible(ds_instance):
    """Test that the static plugin files are accessible."""
    # Get list of static files
    if os.path.exists(STATIC_DIR):
        static_files = os.listdir(STATIC_DIR)
        js_files = [f for f in static_files if f.endswith(".js")]
        css_files = [f for f in static_files if f.endswith(".css")]

        # Test that at least one JS and CSS file can be accessed
        for js_file in js_files[:1]:
            response = await ds_instance.client.get(
                f"/-/static-plugins/datasette_vega/{js_file}"
            )
            assert response.status_code == 200, f"Could not access {js_file}"

        for css_file in css_files[:1]:
            response = await ds_instance.client.get(
                f"/-/static-plugins/datasette_vega/{css_file}"
            )
            assert response.status_code == 200, f"Could not access {css_file}"


@pytest.mark.asyncio
async def test_vega_only_on_table_pages(ds_instance):
    """Test that Vega assets are only injected on table pages."""
    # Table page should have vega assets
    table_response = await ds_instance.client.get("/test/test_data")
    assert "/-/static-plugins/datasette_vega/" in table_response.text

    # Database page should NOT have vega assets
    db_response = await ds_instance.client.get("/test")
    assert "/-/static-plugins/datasette_vega/" not in db_response.text

    # Index page should NOT have vega assets
    index_response = await ds_instance.client.get("/")
    assert "/-/static-plugins/datasette_vega/" not in index_response.text
