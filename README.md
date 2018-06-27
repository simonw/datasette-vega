# datasette-vega

A [Datasette](https://github.com/simonw/datasette) plugin that provides tools
for generating charts using [Vega](https://vega.github.io/).

Try out the latest version as a live demo at https://datasette-vega-latest.datasette.io/

To add this to your Datasette installation, install the plugin like so:

    pip install datasette-vega

The plugin will then add itself to every Datasette table view.

If you are publishing data using the `datasette publish` command, you can
include this plugin like so:

    datasette publish now mydatabase.db --install=datasette-vega
