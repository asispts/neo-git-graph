import type { ReadyRepositoryState } from "@/webview/types/repo";

export function GraphPage({ state }: { state: ReadyRepositoryState }) {
  return <div>Show the repository: {state.selectedRepo.value}</div>;
}
