import { GraphView } from "./layout/GraphView";
import { MainHeader } from "./layout/MainHeader";
import { repoState } from "./lib/store/repo";
import { LoadingPage } from "./pages/LoadingPage";
import { NoRepoPage } from "./pages/NoRepoPage";

export function App() {
  const state = repoState.value;

  if (state.status === "loading") {
    return <LoadingPage />;
  }

  if (state.status === "no-repo") {
    return <NoRepoPage />;
  }

  return (
    <>
      <MainHeader state={state} />
      <GraphView />
    </>
  );
}
