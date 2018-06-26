from datasette import hookimpl


@hookimpl
def extra_css_urls():
    return ["/-/static-plugins/datasette_vega/datasette-vega.css"]


@hookimpl
def extra_js_urls():
    return ["/-/static-plugins/datasette_vega/datasette-vega.js"]
