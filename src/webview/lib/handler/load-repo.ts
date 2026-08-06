import type { ResponseMessage } from "@/types";
import { repoState } from "@/webview/lib/store/repo";
import type { RepoList } from "@/webview/types/repo";

type LoadRepoMessage = Extract<ResponseMessage, { command: "loadRepos" }>;

export function handleLoadRepos(msg: LoadRepoMessage) {
  const repos: RepoList = Object.keys(msg.repos).map((v) => ({
    id: v,
    value: v
  }));

  const [firstRepo] = repos;

  if (firstRepo === undefined) {
    repoState.value = { status: "no-repo" };
    return;
  }

  repoState.value = {
    status: "ready",
    repos,
    selectedRepo: repos.find((repo) => repo.id === msg.lastActiveRepo) ?? firstRepo
  };
}
