import re

import pytest
from datasette.app import Datasette


@pytest.mark.asyncio
async def test_plugin_is_installed():
    ds = Datasette([], memory=True)
    response = await ds.client.get("/-/plugins.json")
    assert response.status_code == 200
    installed_plugins = {p["name"] for p in response.json()}
    assert "datasette-vega" in installed_plugins


@pytest.mark.asyncio
async def test_assets_served_on_table_page():
    ds = Datasette()
    db = ds.add_memory_database("test_vega")
    await db.execute_write("create table if not exists t (id integer primary key)")
    response = await ds.client.get("/test_vega/t")
    assert response.status_code == 200
    js_urls = re.findall(
        r'<script src="(/-/static-plugins/datasette_vega/[^"]+\.js)"', response.text
    )
    css_urls = re.findall(
        r'<link rel="stylesheet" href="(/-/static-plugins/datasette_vega/[^"]+\.css)"',
        response.text,
    )
    assert len(js_urls) == 1, "Expected one bundle - run 'npm run build' first"
    assert len(css_urls) == 1
    for url in js_urls + css_urls:
        asset = await ds.client.get(url)
        assert asset.status_code == 200
        assert len(asset.content) > 0
