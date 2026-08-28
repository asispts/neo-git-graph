import { expect, it } from "vitest";

import type { WebviewConfig } from "@/types";
import { getWebviewConfig, initializeWebviewConfig } from "@/webview/lib/webview-config";

it("initializes the webview configuration once", () => {
  const config: WebviewConfig = {
    autoCenterCommitDetailsView: true,
    dateFormat: "Date & Time",
    fetchAvatars: false,
    graphColours: [],
    graphStyle: "rounded",
    initialLoadCommits: 300,
    loadMoreCommits: 100,
    locale: "en",
    showCurrentBranchByDefault: false
  };

  expect(() => getWebviewConfig()).toThrow("Webview configuration is not initialized");

  initializeWebviewConfig(config);

  expect(getWebviewConfig()).toBe(config);
  expect(() => initializeWebviewConfig(config)).toThrow(
    "Webview configuration is already initialized"
  );
});
