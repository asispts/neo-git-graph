const esbuild = require("esbuild");
const path = require("node:path");

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

async function main() {
  const extension = await esbuild.context({
    entryPoints: ["src/extension.ts"],
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
    entryPoints: ["src/webview/main.ts"],
    bundle: true,
    format: "iife",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    target: "es6",
    outfile: "out/web.min.js",
    logLevel: "silent",
    plugins: [aliasPlugin, esbuildProblemMatcherPlugin]
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
