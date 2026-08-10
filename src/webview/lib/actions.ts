import { SHOW_ALL_BRANCHES } from "@/webview/constants";
import { selectedBranch, selectedRepo, showRemoteBranch } from "@/webview/lib/stores";
import { vscode } from "@/webview/lib/vscode";
import type { CommitBranchType } from "@/webview/types";

export function selectRepo(repo: string) {
  if (repo === selectedRepo.value) {
    return;
  }

  selectedRepo.value = repo;
  selectedBranch.value = undefined;

  vscode.postMessage({ command: "selectRepo", repo });
  loadBranches();
}

export function loadBranches() {
  vscode.postMessage({
    command: "loadBranches",
    showRemoteBranches: showRemoteBranch.value,
    hard: true
  });
}

export function selectBranch(branch: CommitBranchType) {
  selectedBranch.value = branch;

  const repo = selectedRepo.value;
  if (repo === undefined) {
    return;
  }

  vscode.postMessage({
    command: "loadCommits",
    repo,
    branchName: branch === SHOW_ALL_BRANCHES ? "" : branch,
    maxCommits: viewState.initialLoadCommits,
    showRemoteBranches: showRemoteBranch.value,
    hard: true
  });
}
