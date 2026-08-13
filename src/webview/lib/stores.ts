import { signal } from "@preact/signals";

import type { GitCommitDetails, GitCommitNode } from "@/backend/types";
import type {
  ClipboardRequest,
  CommitBranchType,
  ContextMenuState,
  DiffRequest
} from "@/webview/types";

export const repoList = signal<Array<string> | undefined>(undefined);
export const selectedRepo = signal<string | undefined>(undefined);
export const branchList = signal<Array<string> | undefined>(undefined);
export const headBranch = signal<string | null>(null);

export const commitList = signal<Array<GitCommitNode> | undefined>(undefined);
/** Hash of the commit that HEAD points to, or `null` when the repo has no commit. */
export const commitHead = signal<string | null>(null);
export const moreCommitsAvailable = signal<boolean>(false);

/** Hash of the commit whose details view is open, or `null` when none is open. */
export const expandedCommit = signal<string | null>(null);
/** Details of `expandedCommit`, or `null` while they load. */
export const commitDetails = signal<GitCommitDetails | null>(null);
/** Last file diff the user asked for. `lib/sync.ts` sends it to the editor. */
export const diffRequest = signal<DiffRequest | null>(null);
/** Last copy the user asked for. `lib/sync.ts` sends it to the editor. */
export const clipboardRequest = signal<ClipboardRequest | null>(null);

/** The open context menu, or `null` when none is open. Only one opens at a time. */
export const contextMenu = signal<ContextMenuState | null>(null);

export const selectedBranch = signal<CommitBranchType | undefined>(undefined);
export const showRemoteBranch = signal<boolean>(true);
export const maxCommits = signal<number>(viewState.initialLoadCommits);

/**
 * Bump to refetch `loadBranches` and `loadCommits` in `lib/sync.ts`.
 * This refreshes `branchList`, `headBranch`, and the commit list.
 * Selections (`selectedRepo`, `selectedBranch`) stay unchanged.
 */
export const refreshToken = signal<number>(0);
