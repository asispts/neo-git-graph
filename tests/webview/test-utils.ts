import type { LocalizedStrings } from "@/old-extension/l10n/webviewL10n";
import type { WebviewConfig } from "@/types";
import { initDispatcher } from "@/webview/lib/dispatcher";
import { initializeWebviewConfig } from "@/webview/lib/webview-config";

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

export function setupWebviewTest({ dispatchMessages = false } = {}) {
  initializeWebviewConfig(config);
  Object.defineProperty(window, "l10n", {
    value: new Proxy({}, { get: (_target, key) => String(key) }) as LocalizedStrings,
    configurable: true
  });

  if (dispatchMessages) {
    initDispatcher();
  }
}
