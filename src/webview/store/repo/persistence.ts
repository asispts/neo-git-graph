import { effect } from "@preact/signals";

import { readState, writeState } from "@/webview/vscode/storage";

import { currentBranch, currentRepo, showRemoteBranches } from "./state";

type PersistedState = {
  currentRepo: string | null;
  currentBranch: string | null;
  showRemoteBranches: boolean;
};

export function restoreRepoState(): void {
  const saved = readState<PersistedState>();
  if (!saved) {
    return;
  }
  currentRepo.value = saved.currentRepo;
  currentBranch.value = saved.currentBranch;
  showRemoteBranches.value = saved.showRemoteBranches;
}

export function startRepoPersistence(): () => void {
  return effect(() => {
    writeState<PersistedState>({
      currentRepo: currentRepo.value,
      currentBranch: currentBranch.value,
      showRemoteBranches: showRemoteBranches.value
    });
  });
}
