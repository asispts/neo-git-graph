import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "tests-ext/out/**/*.test.js",
  workspaceFolder: ".",
  version: "stable"
});
