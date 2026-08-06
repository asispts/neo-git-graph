import { repoState } from "./lib/store/repo";
import { GraphPage } from "./pages/GraphPage";
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

  return <GraphPage state={state} />;
}
