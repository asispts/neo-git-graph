import { batch } from "@preact/signals";

import type { GitFileChange } from "@/backend/types";
import {
  branchList,
  commitDetails,
  commitHead,
  commitList,
  diffRequest,
  expandedCommit,
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
  closeCommitDetails();
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

export function closeCommitDetails() {
  batch(() => {
    expandedCommit.value = null;
    commitDetails.value = null;
  });
}

/** Open the details view of a commit, or close it when it is already open. */
export function toggleCommitDetails(hash: string) {
  if (hash === expandedCommit.value) {
    closeCommitDetails();
    return;
  }

  batch(() => {
    expandedCommit.value = hash;
    commitDetails.value = null;
  });
}

/** Ask the editor to open the diff of a file of a commit. */
export function viewDiff(commitHash: string, file: GitFileChange) {
  const repo = selectedRepo.value;
  if (repo === undefined) {
    return;
  }

  diffRequest.value = {
    repo,
    commitHash,
    file,
    token: (diffRequest.value?.token ?? 0) + 1
  };
}
