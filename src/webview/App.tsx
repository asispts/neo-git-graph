import { useEffect } from "preact/hooks";

import { Button } from "./components/ui/Button";
import { ContextMenu } from "./components/ui/ContextMenu";
import { Dialog } from "./components/ui/Dialog";
import { ScrollShadow } from "./components/ui/ScrollShadow";
import { GraphView } from "./layout/GraphView";
import { MainHeader } from "./layout/MainHeader";
import { repoStore } from "./lib/stores/repo.store";
import { LoadingPage } from "./pages/LoadingPage";
import { NoRepoPage } from "./pages/NoRepoPage";

export function App() {
  useEffect(() => {
    void repoStore.fetch();
  }, []);
  const repoState = repoStore.get();

  if (repoState.status === "loading") {
    return <LoadingPage />;
  }

  if (repoState.status === "error") {
    return (
      <div role="alert">
        <p>Unable to load repositories: {repoState.message}</p>
        <Button onClick={() => void repoStore.fetch()}>Retry</Button>
      </div>
    );
  }

  if (repoState.repos.length === 0) {
    return <NoRepoPage />;
  }

  return (
    <>
      <MainHeader repos={repoState.repos} />
      <GraphView />
      <ScrollShadow />
      <ContextMenu />
      <Dialog />
    </>
  );
}
