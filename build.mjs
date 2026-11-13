// Bundles src/index.js (plus its CSS) using esbuild.
//
//   node build.mjs        Production build into datasette_vega/static/
//   node build.mjs --dev  Serve the public/index.html demo page with live rebuilds
import * as esbuild from "esbuild";
import { rmSync } from "node:fs";

const dev = process.argv.includes("--dev");

const options = {
  entryPoints: ["src/index.js"],
  bundle: true,
  loader: { ".js": "jsx" },
  jsx: "transform",
  target: "es2020",
  define: {
    "process.env.REACT_APP_STAGE": JSON.stringify(dev ? "dev" : "production"),
    "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production"),
  },
  logLevel: "info",
};

if (dev) {
  const ctx = await esbuild.context({
    ...options,
    outdir: "public/build",
    sourcemap: true,
  });
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: "public", port: 3000 });
  console.log(`Demo page running at http://localhost:${port}/`);
} else {
  // The plugin serves every .js and .css file in this directory, so clear out
  // bundles from previous builds before writing new hashed filenames
  const outdir = "datasette_vega/static";
  rmSync(outdir, { recursive: true, force: true });
  await esbuild.build({
    ...options,
    outdir,
    entryNames: "datasette-vega-[hash]",
    minify: true,
  });
}
