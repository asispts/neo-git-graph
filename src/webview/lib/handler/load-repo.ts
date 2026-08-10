import type { ResponseMessage } from "@/types";
import { selectRepo } from "@/webview/lib/actions";
import { repoList } from "@/webview/lib/stores";
import type { RepoData } from "@/webview/types";

type LoadRepoMessage = Extract<ResponseMessage, { command: "loadRepos" }>;

export function handleLoadRepos(msg: LoadRepoMessage) {
  const repos: Array<RepoData> = Object.keys(msg.repos).map((value) => ({
    label: value.split(/[\\/]/).findLast(Boolean) ?? value,
    value
  }));

  repoList.value = repos;

  const selected =
    repos.find((repo) => repo.value === msg.lastActiveRepo)?.value ?? repos.at(0)?.value ?? null;

  if (selected !== null) {
    selectRepo(selected);
  }
}
