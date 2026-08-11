import { batch } from "@preact/signals";

import type { ResponseMessage } from "@/types";
import { selectRepo } from "@/webview/lib/actions";
import { repoList, selectedRepo } from "@/webview/lib/stores";

type LoadRepoMessage = Extract<ResponseMessage, { command: "loadRepos" }>;

export function handleLoadRepos(msg: LoadRepoMessage) {
  const repos = Object.keys(msg.repos);

  const next =
    repos.find((repo) => repo === selectedRepo.value) ??
    repos.find((repo) => repo === msg.lastActiveRepo) ??
    repos.at(0);

  batch(() => {
    repoList.value = repos;

    if (next !== undefined) {
      selectRepo(next);
    }
  });
}
