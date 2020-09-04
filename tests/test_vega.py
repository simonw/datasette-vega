from datasette.app import Datasette
import pytest
import httpx


@pytest.mark.asyncio
async def test_plugin_is_installed():
    app = Datasette([], memory=True).app()
    async with httpx.AsyncClient(app=app) as client:
        response = await client.get("http://localhost/-/plugins.json")
        assert response.status_code == 200
        installed_plugins = {p["name"] for p in response.json()}
        assert "datasette-vega" in installed_plugins
