import type { WebviewConfig } from "@/types";

let config: WebviewConfig | undefined;

export function initializeWebviewConfig(value: WebviewConfig): void {
  if (config !== undefined) {
    throw new Error("Webview configuration is already initialized");
  }

  config = value;
}

export function getWebviewConfig(): WebviewConfig {
  if (config === undefined) {
    throw new Error("Webview configuration is not initialized");
  }

  return config;
}
