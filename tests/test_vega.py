import pytest
from datasette.app import Datasette


@pytest.mark.asyncio
async def test_plugin_is_installed():
    ds = Datasette([], memory=True)
    response = await ds.client.get("/-/plugins.json")
    assert response.status_code == 200
    installed_plugins = {p["name"] for p in response.json()}
    assert "datasette-vega" in installed_plugins
