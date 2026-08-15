const fs = require("node:fs");
const path = require("node:path");

const tailwindcss = require("@tailwindcss/postcss");
const esbuild = require("esbuild");
const postcss = require("postcss");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log("[watch] build finished");
    });
  }
};

const aliasPlugin = {
  name: "alias",
  setup(build) {
    build.onResolve({ filter: /^@\// }, async (args) => {
      const resolved = path.resolve(__dirname, "src", args.path.slice(2));
      return build.resolve(resolved, { kind: args.kind, resolveDir: path.dirname(resolved) });
    });
  }
};

// Run Tailwind (via PostCSS) over CSS files before esbuild bundles them, so
// `@import "tailwindcss/..."` and utility classes are resolved. Tailwind reports
// every file it scans for classes. Those files become esbuild watch files, so
// that a new class in a component regenerates the CSS in watch mode.
const tailwindPlugin = {
  name: "tailwindcss",
  setup(build) {
    const processor = postcss([tailwindcss()]);
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, "utf8");
      const result = await processor.process(source, { from: args.path });

      const watchFiles = [];
      const watchDirs = [];
      for (const message of result.messages) {
        if (message.type === "dependency") {
          watchFiles.push(message.file);
        } else if (message.type === "dir-dependency") {
          watchDirs.push(message.dir);
        }
      }

      return {
        contents: result.css,
        loader: "css",
        resolveDir: path.dirname(args.path),
        watchFiles,
        watchDirs
      };
    });
  }
};

async function main() {
  const extension = await esbuild.context({
    entryPoints: ["src/extension/main.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    target: "es6",
    outfile: "out/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [aliasPlugin, esbuildProblemMatcherPlugin]
  });

  const webview = await esbuild.context({
    entryPoints: ["src/webview/main.tsx"],
    bundle: true,
    format: "iife",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    target: "es2020",
    jsx: "automatic",
    jsxImportSource: "preact",
    outfile: "out/web.min.js",
    logLevel: "silent",
    plugins: [tailwindPlugin, aliasPlugin, esbuildProblemMatcherPlugin]
  });

  if (watch) {
    await Promise.all([extension.watch(), webview.watch()]);
  } else {
    await extension.rebuild();
    await extension.dispose();
    await webview.rebuild();
    await webview.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
