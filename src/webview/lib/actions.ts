import { batch } from "@preact/signals";

import {
  branchList,
  commitHead,
  commitList,
  headBranch,
  maxCommits,
  moreCommitsAvailable,
  refreshToken,
  selectedBranch,
  selectedRepo,
  showRemoteBranch
} from "@/webview/lib/stores";
import type { CommitBranchType } from "@/webview/types";

function clearCommits() {
  commitList.value = undefined;
  commitHead.value = null;
  moreCommitsAvailable.value = false;
  maxCommits.value = viewState.initialLoadCommits;
}

export function selectRepo(repo: string) {
  if (repo === selectedRepo.value) {
    return;
  }

  batch(() => {
    selectedRepo.value = repo;
    branchList.value = undefined;
    headBranch.value = null;
    selectedBranch.value = undefined;
    clearCommits();
  });
}

export function selectBranch(branch: CommitBranchType) {
  if (branch === selectedBranch.value) {
    return;
  }

  batch(() => {
    selectedBranch.value = branch;
    clearCommits();
  });
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
