"""
Comprehensive Playwright tests for datasette-vega plugin.

These tests verify the browser-based functionality of the Vega charting
interface, including chart rendering, UI interactions, and state persistence.

Uses Playwright's async API for better compatibility with pytest-asyncio.
"""
import os
import shutil
import sqlite3
import tempfile
import asyncio

import pytest
from playwright.async_api import async_playwright, expect

# Skip all tests if playwright is not available
pytest.importorskip("playwright")


@pytest.fixture(scope="module")
def test_db_path(build_static_assets):
    """Create a temporary database with test data for playwright tests."""
    tmp_dir = tempfile.mkdtemp()
    db_path = os.path.join(tmp_dir, "test.db")

    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE test_data (
            id INTEGER PRIMARY KEY,
            name TEXT,
            value REAL,
            category TEXT,
            date TEXT
        )
    """)
    # Insert test data suitable for charting
    test_rows = [
        (1, "Alpha", 10.5, "A", "2024-01-01"),
        (2, "Beta", 20.3, "B", "2024-01-02"),
        (3, "Gamma", 15.7, "A", "2024-01-03"),
        (4, "Delta", 25.1, "B", "2024-01-04"),
        (5, "Epsilon", 30.2, "A", "2024-01-05"),
        (6, "Zeta", 12.8, "C", "2024-01-06"),
        (7, "Eta", 18.4, "C", "2024-01-07"),
        (8, "Theta", 22.6, "A", "2024-01-08"),
        (9, "Iota", 28.9, "B", "2024-01-09"),
        (10, "Kappa", 35.0, "C", "2024-01-10"),
    ]
    conn.executemany(
        "INSERT INTO test_data (id, name, value, category, date) VALUES (?, ?, ?, ?, ?)",
        test_rows
    )
    conn.commit()
    conn.close()

    yield db_path

    # Cleanup
    shutil.rmtree(tmp_dir, ignore_errors=True)


@pytest.fixture(scope="module")
def datasette_server(test_db_path):
    """Start a Datasette server for playwright tests."""
    import threading
    import time
    import socket
    from datasette.app import Datasette
    import uvicorn

    ds = Datasette([test_db_path])
    app = ds.app()

    # Find a free port
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('localhost', 0))
    port = sock.getsockname()[1]
    sock.close()

    # Run uvicorn in a thread
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error")
    server = uvicorn.Server(config)

    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    # Wait for server to be ready
    max_retries = 30
    for _ in range(max_retries):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            if result == 0:
                break
        except Exception:
            pass
        time.sleep(0.1)

    yield f"http://127.0.0.1:{port}"


@pytest.fixture
async def browser():
    """Create a browser instance for tests."""
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        yield browser
        await browser.close()


@pytest.fixture
async def page(browser):
    """Create a new page for each test."""
    page = await browser.new_page()
    yield page
    await page.close()


class TestVegaPluginUI:
    """Tests for the basic Vega plugin UI elements."""

    @pytest.mark.asyncio
    async def test_show_charting_options_button_visible(self, page, datasette_server: str):
        """Test that the 'Show charting options' button is visible on table pages."""
        await page.goto(f"{datasette_server}/test/test_data")

        button = page.locator("button:has-text('Show charting options')").first
        await expect(button).to_be_visible()

    @pytest.mark.asyncio
    async def test_charting_options_initially_hidden(self, page, datasette_server: str):
        """Test that charting options are hidden before clicking the button."""
        await page.goto(f"{datasette_server}/test/test_data")

        form = page.locator("form#graphForm")
        await expect(form).not_to_be_visible()

    @pytest.mark.asyncio
    async def test_show_charting_options_reveals_form(self, page, datasette_server: str):
        """Test that clicking the button shows the charting form."""
        await page.goto(f"{datasette_server}/test/test_data")

        await page.click("button:has-text('Show charting options')")

        form = page.locator("form#graphForm")
        await expect(form).to_be_visible()

        await expect(page.locator("h3:has-text('Charting options')")).to_be_visible()

    @pytest.mark.asyncio
    async def test_chart_type_radio_buttons(self, page, datasette_server: str):
        """Test that chart type radio buttons are present and functional."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        bar_radio = page.locator("input[type='radio'][value='bar']")
        line_radio = page.locator("input[type='radio'][value='line']")
        circle_radio = page.locator("input[type='radio'][value='circle']")

        await expect(bar_radio).to_be_visible()
        await expect(line_radio).to_be_visible()
        await expect(circle_radio).to_be_visible()

        await expect(page.locator("label:has-text('Bar')")).to_be_visible()
        await expect(page.locator("label:has-text('Line')")).to_be_visible()
        await expect(page.locator("label:has-text('Scatter')")).to_be_visible()

    @pytest.mark.asyncio
    async def test_column_dropdowns_populated(self, page, datasette_server: str):
        """Test that column dropdown menus are populated with table columns."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        x_column_select = page.locator("select[name='x_column']")
        await expect(x_column_select).to_be_visible()

        options = await x_column_select.locator("option").all_text_contents()
        assert "id" in options
        assert "name" in options
        assert "value" in options
        assert "category" in options

    @pytest.mark.asyncio
    async def test_type_dropdowns_have_options(self, page, datasette_server: str):
        """Test that type dropdown menus have the expected options."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        x_type_select = page.locator("select[name='x_type']")
        await expect(x_type_select).to_be_visible()

        options = await x_type_select.locator("option").all_text_contents()
        assert "Numeric" in options
        assert "Label" in options
        assert "Category" in options
        assert "Date/time" in options


class TestChartRendering:
    """Tests for chart rendering functionality."""

    @pytest.mark.asyncio
    async def test_bar_chart_renders(self, page, datasette_server: str):
        """Test that selecting bar chart renders a visualization."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        await page.click("input[type='radio'][value='bar']")

        await page.wait_for_timeout(1000)

        vega_container = page.locator(".vega-embed")
        await expect(vega_container).to_be_visible()

    @pytest.mark.asyncio
    async def test_line_chart_renders(self, page, datasette_server: str):
        """Test that selecting line chart renders a visualization."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        await page.click("input[type='radio'][value='line']")

        await page.wait_for_timeout(1000)

        vega_container = page.locator(".vega-embed")
        await expect(vega_container).to_be_visible()

    @pytest.mark.asyncio
    async def test_scatter_chart_renders(self, page, datasette_server: str):
        """Test that selecting scatter chart renders a visualization."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        await page.click("input[type='radio'][value='circle']")

        await page.wait_for_timeout(1000)

        vega_container = page.locator(".vega-embed")
        await expect(vega_container).to_be_visible()

    @pytest.mark.asyncio
    async def test_chart_updates_on_column_change(self, page, datasette_server: str):
        """Test that changing column selection updates the chart."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")
        await page.click("input[type='radio'][value='bar']")

        await page.wait_for_timeout(500)

        await page.select_option("select[name='y_column']", "value")

        await page.wait_for_timeout(500)

        vega_container = page.locator(".vega-embed")
        await expect(vega_container).to_be_visible()


class TestSwapAxes:
    """Tests for the swap X/Y axis functionality."""

    @pytest.mark.asyncio
    async def test_swap_button_exists(self, page, datasette_server: str):
        """Test that the swap X and Y button exists."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        swap_button = page.locator("button:has-text('Swap X and Y')")
        await expect(swap_button).to_be_visible()

    @pytest.mark.asyncio
    async def test_swap_axes_changes_selections(self, page, datasette_server: str):
        """Test that swapping axes actually switches X and Y column selections."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        await page.select_option("select[name='x_column']", "id")
        await page.select_option("select[name='y_column']", "value")

        x_initial = await page.locator("select[name='x_column']").input_value()
        y_initial = await page.locator("select[name='y_column']").input_value()

        await page.click("button:has-text('Swap X and Y')")

        await page.wait_for_timeout(300)

        x_after = await page.locator("select[name='x_column']").input_value()
        y_after = await page.locator("select[name='y_column']").input_value()

        assert x_after == y_initial
        assert y_after == x_initial


class TestColorAndSize:
    """Tests for color and size encoding options."""

    @pytest.mark.asyncio
    async def test_color_dropdown_has_none_option(self, page, datasette_server: str):
        """Test that color dropdown includes a 'none' option."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        color_select = page.locator("select[name='color_column']")
        await expect(color_select).to_be_visible()

        options = await color_select.locator("option").all_text_contents()
        assert "-- none --" in options

    @pytest.mark.asyncio
    async def test_size_dropdown_has_none_option(self, page, datasette_server: str):
        """Test that size dropdown includes a 'none' option."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        size_select = page.locator("select[name='size_column']")
        await expect(size_select).to_be_visible()

        options = await size_select.locator("option").all_text_contents()
        assert "-- none --" in options

    @pytest.mark.asyncio
    async def test_color_encoding_applied(self, page, datasette_server: str):
        """Test that selecting a color column updates the chart."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")
        await page.click("input[type='radio'][value='circle']")

        await page.wait_for_timeout(500)

        await page.select_option("select[name='color_column']", "category")

        await page.wait_for_timeout(500)

        vega_container = page.locator(".vega-embed")
        await expect(vega_container).to_be_visible()


class TestURLStatePersistence:
    """Tests for URL fragment state persistence."""

    @pytest.mark.asyncio
    async def test_chart_state_saved_in_url_hash(self, page, datasette_server: str):
        """Test that chart configuration is saved in URL hash."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")

        await page.click("input[type='radio'][value='bar']")

        await page.wait_for_timeout(500)

        url = page.url
        assert "#" in url
        assert "g.mark=bar" in url

    @pytest.mark.asyncio
    async def test_chart_state_restored_from_url(self, page, datasette_server: str):
        """Test that chart configuration is restored from URL hash."""
        await page.goto(
            f"{datasette_server}/test/test_data#g.mark=line&g.x_column=id&g.y_column=value"
        )

        await page.wait_for_timeout(1000)

        form = page.locator("form#graphForm").first
        await expect(form).to_be_visible()

        line_radio = page.locator("input[type='radio'][value='line']").first
        await expect(line_radio).to_be_checked()

        vega_container = page.locator(".vega-embed").first
        await expect(vega_container).to_be_visible()


class TestNoVegaOnNonTablePages:
    """Tests to verify Vega plugin doesn't appear on non-table pages."""

    @pytest.mark.asyncio
    async def test_no_vega_on_database_page(self, page, datasette_server: str):
        """Test that Vega button doesn't appear on database page."""
        await page.goto(f"{datasette_server}/test")

        await page.wait_for_load_state("networkidle")

        button = page.locator("button:has-text('Show charting options')")
        await expect(button).not_to_be_visible()

    @pytest.mark.asyncio
    async def test_no_vega_on_index_page(self, page, datasette_server: str):
        """Test that Vega button doesn't appear on index page."""
        await page.goto(f"{datasette_server}/")

        await page.wait_for_load_state("networkidle")

        button = page.locator("button:has-text('Show charting options')")
        await expect(button).not_to_be_visible()


class TestChartTypeOptions:
    """Tests for different type options in X and Y dropdowns."""

    @pytest.mark.asyncio
    async def test_numeric_binned_option(self, page, datasette_server: str):
        """Test that 'Numeric, binned' option works correctly."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")
        await page.click("input[type='radio'][value='bar']")

        await page.select_option("select[name='x_type']", "quantitative-bin")

        await page.wait_for_timeout(500)

        vega_container = page.locator(".vega-embed")
        await expect(vega_container).to_be_visible()

        assert "g.x_type=quantitative-bin" in page.url

    @pytest.mark.asyncio
    async def test_temporal_type_option(self, page, datasette_server: str):
        """Test that temporal type option works with date column."""
        await page.goto(f"{datasette_server}/test/test_data")
        await page.click("button:has-text('Show charting options')")
        await page.click("input[type='radio'][value='line']")

        await page.select_option("select[name='x_column']", "date")
        await page.select_option("select[name='x_type']", "temporal")
        await page.select_option("select[name='y_column']", "value")

        await page.wait_for_timeout(500)

        vega_container = page.locator(".vega-embed")
        await expect(vega_container).to_be_visible()


class TestVegaStaticAssets:
    """Tests for static asset loading."""

    @pytest.mark.asyncio
    async def test_css_loaded(self, page, datasette_server: str):
        """Test that datasette-vega CSS is loaded."""
        await page.goto(f"{datasette_server}/test/test_data")

        css_links = page.locator("link[href*='datasette_vega'][href*='.css']")
        await expect(css_links.first).to_be_attached()

    @pytest.mark.asyncio
    async def test_js_loaded(self, page, datasette_server: str):
        """Test that datasette-vega JS is loaded."""
        await page.goto(f"{datasette_server}/test/test_data")

        js_scripts = page.locator("script[src*='datasette_vega'][src*='.js']")
        await expect(js_scripts.first).to_be_attached()
