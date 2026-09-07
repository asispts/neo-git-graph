import "./styles.css";

import { render } from "preact";
import { useEffect } from "preact/hooks";

import { App } from "./App";
import { Button } from "./components/ui/Button";
import { selectRepo } from "./lib/actions";
import { initDispatcher } from "./lib/dispatcher";
import { loadRepoList, repoListError } from "./lib/load-repos";
import { rpc } from "./lib/rpc/rpc-client";
import { initializeStores, selectedRepo } from "./lib/stores";
import { repoListStore } from "./lib/stores/repo-list.store";
import { initializeWebviewConfig } from "./lib/webview-config";
import { LoadingPage } from "./pages/LoadingPage";
import { NoRepoPage } from "./pages/NoRepoPage";

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

  render(<Root />, root);
  await loadRepoList();
}

function Root() {
  const repos = repoListStore.get();
  const error = repoListError.value;

  useEffect(() => {
    if (repos === undefined) {
      return;
    }

    if (repos.length === 0) {
      selectedRepo.value = undefined;
      return;
    }

    const firstRepo = repos[0];
    if (firstRepo !== undefined && !repos.some((repo) => repo.path === selectedRepo.value)) {
      selectRepo(firstRepo.path);
    }
  }, [repos]);

  if (error !== undefined) {
    return (
      <div role="alert">
        <p>Unable to load repositories: {error}</p>
        <Button onClick={() => void loadRepoList()}>Retry</Button>
      </div>
    );
  }

  if (repos === undefined) {
    return <LoadingPage />;
  }

  return repos.length === 0 ? <NoRepoPage /> : <App repos={repos} />;
}
