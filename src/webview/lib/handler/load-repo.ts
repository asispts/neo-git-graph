import { batch } from "@preact/signals";

import type { ResponseMessage } from "@/types";
import { maxCommits, repoList, selectedBranch, selectedRepo } from "@/webview/lib/stores";
import type { RepoData } from "@/webview/types";

type LoadRepoMessage = Extract<ResponseMessage, { command: "loadRepos" }>;

export function handleLoadRepos(msg: LoadRepoMessage) {
  const repos: Array<RepoData> = Object.keys(msg.repos).map((value) => ({
    label: value.split(/[\\/]/).findLast(Boolean) ?? value,
    value
  }));

  const next = repos.find((repo) => repo.value === msg.lastActiveRepo)?.value ?? repos.at(0)?.value;

  batch(() => {
    repoList.value = repos;

    if (next !== undefined && next !== selectedRepo.value) {
      selectedRepo.value = next;
      selectedBranch.value = undefined;
      maxCommits.value = viewState.initialLoadCommits;
    }
  });
}
