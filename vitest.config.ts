import path from "node:path";

import { defineConfig } from "vitest/config";

const alias = [{ find: /^@\//, replacement: path.resolve(__dirname, "src") + "/" }];

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "backend",
          include: ["tests/backend/**/*.test.ts"]
        }
      },
      {
        resolve: {
          alias: [
            ...alias,
            {
              find: "vscode",
              replacement: path.resolve(__dirname, "tests/webview/__mocks__/vscode.ts")
            }
          ]
        },
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
