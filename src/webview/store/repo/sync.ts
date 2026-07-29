import type { GitRepoSet } from "@/types";
import { config } from "@/webview/config";
import { onMessage, sendMessage } from "@/webview/vscode/messaging";

import { attachRepo, requestBranches } from "./actions";
import { pickBranch, pickRepo } from "./policy";
import { attachedRepo, branchHead, branches, currentBranch, currentRepo, repos } from "./state";

function clearRepo(): void {
  currentRepo.value = null;
  attachedRepo.value = null;
  currentBranch.value = null;
  branches.value = [];
  branchHead.value = null;
}

function applyRepos(next: GitRepoSet, lastActiveRepo: string | null): void {
  repos.value = next;

  const repo = pickRepo(next, currentRepo.value, lastActiveRepo);
  if (repo === null) {
    clearRepo();
    return;
  }
  if (repo !== currentRepo.value) {
    currentBranch.value = null;
  }
  if (repo !== attachedRepo.value) {
    attachRepo(repo);
  }
}

function applyBranches(next: string[], head: string | null): void {
  branches.value = next;
  branchHead.value = head;
  currentBranch.value = pickBranch(
    currentBranch.value,
    next,
    head,
    config.showCurrentBranchByDefault
  );
}

export function startRepoSync(): void {
  onMessage("loadRepos", (msg) => applyRepos(msg.repos, msg.lastActiveRepo));
  onMessage("loadBranches", (msg) => {
    if (msg.isRepo) {
      applyBranches(msg.branches, msg.head);
    }
  });
  onMessage("refresh", () => requestBranches(false));

  sendMessage({ command: "loadRepos", check: false });
}
