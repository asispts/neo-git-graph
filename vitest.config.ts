import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "features",
          include: ["tests/backend/**/*.test.ts"]
        }
      },
      {
        test: {
          name: "webview",
          environment: "jsdom",
          include: ["tests/webview/**/*.test.ts"],
          setupFiles: ["tests/webview/setup.ts"]
        }
      }
    ]
  }
});
