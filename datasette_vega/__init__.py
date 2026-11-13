from datasette import hookimpl
import glob
import os

cache = {}
static_dir = os.path.join(os.path.dirname(__file__), "static")


def cached_filepaths_for_extension(extension):
    pattern = os.path.join(static_dir, "*.{}".format(extension))
    if pattern not in cache:
        cache[pattern] = [
            "/-/static-plugins/datasette_vega/{}".format(os.path.basename(g))
            for g in glob.glob(pattern)
        ]
    return cache[pattern]


def should_include_assets(template, view_name):
    # Table pages, plus SQL query pages - those report view_name="database"
    # but render query.html (or a custom query-*.html template)
    return view_name == "table" or (template or "").startswith("query")


@hookimpl
def extra_css_urls(template, view_name):
    if should_include_assets(template, view_name):
        return cached_filepaths_for_extension("css")


@hookimpl
def extra_js_urls(template, view_name):
    if should_include_assets(template, view_name):
        return cached_filepaths_for_extension("js")
