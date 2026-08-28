import "./styles.css";

import { render } from "preact";

import type { GitRepo } from "@/types";

import { App } from "./App";
import { Button } from "./components/ui/Button";
import { initDispatcher } from "./lib/dispatcher";
import { rpc } from "./lib/rpc/rpc-client";
import { initializeStores } from "./lib/stores";
import { repoListStore } from "./lib/stores/repo-list.store";
import { initializeWebviewConfig } from "./lib/webview-config";
import { LoadingPage } from "./pages/LoadingPage";

const root = document.getElementById("app")!;

initDispatcher();
render(<LoadingPage />, root);

void main().catch((error: unknown) => {
  render(
    <div role="alert">
      Unable to initialize the webview: {error instanceof Error ? error.message : String(error)}
    </div>,
    root
  );
});

async function main() {
  const { l10n, config } = await rpc.call("webview.initialize", null);
  window.l10n = l10n;
  initializeWebviewConfig(config);
  initializeStores(config.initialLoadCommits);

  await loadRepoList();
}

async function loadRepoList() {
  render(<LoadingPage />, root);

  let repos: Array<GitRepo>;
  try {
    repos = await repoListStore.load();
  } catch (error: unknown) {
    render(
      <div role="alert">
        <p>Unable to load repositories: {error instanceof Error ? error.message : String(error)}</p>
        <Button onClick={() => void loadRepoList()}>Retry</Button>
      </div>,
      root
    );
    return;
  }

  render(<App repos={repos} />, root);
}
