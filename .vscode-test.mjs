import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "tests/out/extension/**/*.test.js",
  workspaceFolder: ".",
  version: "stable",
});
