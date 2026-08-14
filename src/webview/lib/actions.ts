import { batch } from "@preact/signals";
import type { ComponentChildren } from "preact";

import type { ActionRequest, GitFileChange } from "@/backend/types";
import {
  actionRequest,
  branchList,
  clipboardRequest,
  commitDetails,
  commitHead,
  commitList,
  contextMenu,
  dialog,
  diffRequest,
  expandedCommit,
  headBranch,
  maxCommits,
  moreCommitsAvailable,
  refreshToken,
  repoStateRequest,
  repoStates,
  selectedBranch,
  selectedRepo,
  showRemoteBranch,
  uncommittedChanges
} from "@/webview/lib/stores";
import type {
  ActionCommand,
  CommitBranchType,
  ContextMenuEntry,
  DialogBody,
  DialogInput,
  DialogValues
} from "@/webview/types";

function clearCommits() {
  commitList.value = undefined;
  commitHead.value = null;
  moreCommitsAvailable.value = false;
  uncommittedChanges.value = 0;
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

/** Resize the columns of the commit table, while the user drags a boundary. */
export function setColumnWidths(widths: Array<number>) {
  const repo = selectedRepo.value;
  if (repo === undefined) {
    return;
  }

  repoStates.value = {
    ...repoStates.value,
    [repo]: { ...repoStates.value[repo], columnWidths: widths }
  };
}

/** Resize the columns of the commit table, and keep the widths for the next session. */
export function saveColumnWidths(widths: Array<number>) {
  const repo = selectedRepo.value;
  if (repo === undefined) {
    return;
  }

  batch(() => {
    setColumnWidths(widths);
    repoStateRequest.value = {
      repo,
      state: repoStates.value[repo],
      token: (repoStateRequest.value?.token ?? 0) + 1
    };
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

/** Open a dialog. The context menu that asked for it closes. */
function openDialog(body: DialogBody) {
  batch(() => {
    contextMenu.value = null;
    dialog.value = { ...body, token: (dialog.value?.token ?? 0) + 1 };
  });
}

export function closeDialog() {
  dialog.value = null;
}

type FormDialog<T extends ReadonlyArray<DialogInput>> = {
  message: ComponentChildren;
  inputs: T;
  /** Label of the button that submits the form. */
  action: string;
  /** Context menu key of the element the dialog belongs to. */
  source: string | null;
  onSubmit: (values: DialogValues<T>) => void;
};

/**
 * Ask the user to fill in a form, or to confirm when `inputs` is empty.
 * The dialog fills one value per input, in order, so the tuple type holds.
 */
export function openFormDialog<const T extends ReadonlyArray<DialogInput>>({
  message,
  inputs,
  action,
  source,
  onSubmit
}: FormDialog<T>) {
  openDialog({
    kind: "form",
    message,
    inputs: [...inputs],
    action,
    onSubmit: onSubmit as (values: Array<string | boolean>) => void,
    source
  });
}

/** Report a command that failed. `reason` holds the output of git. */
export function openErrorDialog(message: string, reason: string | null = null) {
  openDialog({ kind: "error", message, reason });
}

/** Report a command that runs longer than the others. The response replaces it. */
export function openRunningDialog(message: string) {
  openDialog({ kind: "running", message });
}

/** Ask the editor to run a git command on the selected repo. */
export function runAction(command: ActionCommand) {
  const repo = selectedRepo.value;
  if (repo === undefined) {
    return;
  }

  actionRequest.value = {
    action: { ...command, repo } as ActionRequest,
    token: (actionRequest.value?.token ?? 0) + 1
  };
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
