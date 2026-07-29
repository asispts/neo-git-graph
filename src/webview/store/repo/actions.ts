import { sendMessage } from "@/webview/vscode/messaging";

import { attachedRepo, currentBranch, currentRepo, showRemoteBranches } from "./state";

export function requestBranches(hard: boolean): void {
  sendMessage({ command: "loadBranches", showRemoteBranches: showRemoteBranches.value, hard });
}

export function attachRepo(repo: string): void {
  currentRepo.value = repo;
  attachedRepo.value = repo;
  sendMessage({ command: "selectRepo", repo });
  requestBranches(true);
}

export function selectRepo(repo: string): void {
  if (repo === currentRepo.value) {
    return;
  }
  currentBranch.value = null;
  attachRepo(repo);
}

export function selectBranch(branch: string): void {
  currentBranch.value = branch;
}

export function setShowRemoteBranches(value: boolean): void {
  showRemoteBranches.value = value;
  requestBranches(true);
}

export function refresh(): void {
  sendMessage({ command: "loadRepos", check: true });
  requestBranches(true);
}
