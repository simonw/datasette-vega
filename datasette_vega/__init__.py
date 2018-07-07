from datasette import hookimpl
import glob
import os

cache = {}
static_dir = os.path.join(
    os.path.dirname(__file__), 'static'
)

def cached_filepaths_for_extension(extension):
    pattern = os.path.join(static_dir, '*.{}'.format(extension))
    if pattern not in cache:
        cache[pattern] = [
            "/-/static-plugins/datasette_vega/{}".format(
                os.path.basename(g)
            )
            for g in glob.glob(pattern)
        ]
    return cache[pattern]


@hookimpl
def extra_css_urls():
    return cached_filepaths_for_extension('css')


@hookimpl
def extra_js_urls():
    return cached_filepaths_for_extension('js')
