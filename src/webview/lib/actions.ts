import { batch } from "@preact/signals";

import {
  branchList,
  headBranch,
  maxCommits,
  refreshToken,
  selectedBranch,
  selectedRepo,
  showRemoteBranch
} from "@/webview/lib/stores";
import type { CommitBranchType } from "@/webview/types";

export function selectRepo(repo: string) {
  if (repo === selectedRepo.value) {
    return;
  }

  batch(() => {
    selectedRepo.value = repo;
    branchList.value = undefined;
    headBranch.value = null;
    selectedBranch.value = undefined;
    maxCommits.value = viewState.initialLoadCommits;
  });
}

export function selectBranch(branch: CommitBranchType) {
  selectedBranch.value = branch;
}

export function setShowRemoteBranch(value: boolean) {
  showRemoteBranch.value = value;
}

export function loadMoreCommits() {
  maxCommits.value += viewState.loadMoreCommits;
}

export function refresh() {
  refreshToken.value++;
}
