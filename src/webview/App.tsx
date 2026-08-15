import { ContextMenu } from "./components/ui/ContextMenu";
import { Dialog } from "./components/ui/Dialog";
import { ScrollShadow } from "./components/ui/ScrollShadow";
import { GraphView } from "./layout/GraphView";
import { MainHeader } from "./layout/MainHeader";
import { repoList } from "./lib/stores";
import { LoadingPage } from "./pages/LoadingPage";
import { NoRepoPage } from "./pages/NoRepoPage";

export function App() {
  const repos = repoList.value;

  if (repos === undefined) {
    return <LoadingPage />;
  }

  if (repos.length === 0) {
    return <NoRepoPage />;
  }

  return (
    <>
      <MainHeader repos={repos} />
      <GraphView />
      <ScrollShadow />
      <ContextMenu />
      <Dialog />
    </>
  );
}
