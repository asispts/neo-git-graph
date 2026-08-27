import "./styles.css";

import { render } from "preact";

import { App } from "./App";
import { initDispatcher } from "./lib/dispatcher";
import { rpc } from "./lib/rpc/rpc-client";
import { initializeStores } from "./lib/stores";
import { vscode } from "./lib/vscode";
import { initializeWebviewConfig } from "./lib/webview-config";

void main().catch((error: unknown) => {
  render(
    <div role="alert">
      Unable to initialize the webview: {error instanceof Error ? error.message : String(error)}
    </div>,
    document.getElementById("app")!
  );
});

async function main() {
  initDispatcher();

  const { l10n, config } = await rpc.call("webview.initialize", null);
  window.l10n = l10n;
  initializeWebviewConfig(config);
  initializeStores(config.initialLoadCommits);

  vscode.postMessage({ command: "loadRepos", check: false });

  render(<App />, document.getElementById("app")!);
}
