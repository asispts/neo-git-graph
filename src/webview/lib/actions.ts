import { batch } from "@preact/signals";

import type { GitFileChange } from "@/backend/types";
import {
  branchList,
  clipboardRequest,
  commitDetails,
  commitHead,
  commitList,
  contextMenu,
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
import type { CommitBranchType, ContextMenuEntry } from "@/webview/types";

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

/**
 * Open a context menu at the pointer. The default menu of the host is
 * suppressed, because browser-based VS Code draws it on top of ours.
 */
export function openContextMenu(
  event: MouseEvent,
  source: string,
  entries: Array<ContextMenuEntry>
) {
  event.preventDefault();
  event.stopPropagation();
  contextMenu.value = { x: event.clientX, y: event.clientY, entries, source };
}

export function closeContextMenu() {
  contextMenu.value = null;
}

/** Ask the editor to put text on the clipboard. `type` names it in error messages. */
export function copyToClipboard(type: string, data: string) {
  clipboardRequest.value = {
    type,
    data,
    token: (clipboardRequest.value?.token ?? 0) + 1
  };
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
