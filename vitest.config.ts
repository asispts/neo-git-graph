import path from "node:path";

import { defineConfig } from "vitest/config";

const alias = [
  { find: /^@\//, replacement: path.resolve(__dirname, "src") + "/" },
  { find: /^@tests\//, replacement: path.resolve(__dirname, "tests") + "/" }
];

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
              replacement: path.resolve(__dirname, "tests/extension/__mocks__/vscode.ts")
            }
          ]
        },
        test: {
          name: "extension",
          include: ["tests/extension/**/*.test.ts"]
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
