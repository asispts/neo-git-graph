import { computed, signal } from "@preact/signals";

import type { GitCommitDetails, GitCommitNode } from "@/backend/types";
import type { GitRepoSet } from "@/types";
import type { CommitBranchType, ContextMenuState, DialogState } from "@/webview/types";
import { isColumnWidths } from "@/webview/utils/columns";

export const repoList = signal<Array<string> | undefined>(undefined);
export const selectedRepo = signal<string | undefined>(undefined);
export const branchList = signal<Array<string> | undefined>(undefined);
export const headBranch = signal<string | null>(null);

export const commitList = signal<Array<GitCommitNode> | undefined>(undefined);
/** Hash of the commit that HEAD points to, or `null` when the repo has no commit. */
export const commitHead = signal<string | null>(null);
export const moreCommitsAvailable = signal<boolean>(false);
/** Number of unsaved changes. `0` when the uncommitted row is absent. */
export const uncommittedChanges = signal<number>(0);

/** Hash of the commit whose details view is open, or `null` when none is open. */
export const expandedCommit = signal<string | null>(null);
/** Details of `expandedCommit`, or `null` while they load. */
export const commitDetails = signal<GitCommitDetails | null>(null);

/** The open context menu, or `null` when none is open. Only one opens at a time. */
export const contextMenu = signal<ContextMenuState | null>(null);
/** The open dialog, or `null` when none is open. Only one opens at a time. */
export const dialog = signal<DialogState | null>(null);

/**
 * Menu key of the element whose context menu or dialog is open. The element
 * highlights itself while it owns one of the two.
 */
export const activeSource = computed(() => {
  const menu = contextMenu.value;
  if (menu !== null) {
    return menu.source;
  }

  const open = dialog.value;
  return open !== null && open.kind === "form" ? open.source : null;
});

/** State the editor keeps per repo. `lib/handler/load-repo.ts` refreshes it. */
export const repoStates = signal<GitRepoSet>(viewState.repos);

/**
 * Widths of the resizable columns of the selected repo, or `null` while the
 * browser sizes the table itself.
 */
export const columnWidths = computed(() => {
  const repo = selectedRepo.value;
  const widths = repo === undefined ? null : (repoStates.value[repo]?.columnWidths ?? null);

  return isColumnWidths(widths) ? widths : null;
});

export const selectedBranch = signal<CommitBranchType | undefined>(undefined);
export const showRemoteBranch = signal<boolean>(true);
export const maxCommits = signal<number>(viewState.initialLoadCommits);

/**
 * Bump to refetch `loadBranches` and `loadCommits` in `lib/sync.ts`.
 * This refreshes `branchList`, `headBranch`, and the commit list.
 * Selections (`selectedRepo`, `selectedBranch`) stay unchanged.
 */
export const refreshToken = signal<number>(0);
