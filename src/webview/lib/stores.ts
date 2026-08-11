import { signal } from "@preact/signals";

import type { GitCommitNode } from "@/backend/types";
import type { CommitBranchType } from "@/webview/types";

export const repoList = signal<Array<string> | undefined>(undefined);
export const selectedRepo = signal<string | undefined>(undefined);
export const branchList = signal<Array<string> | undefined>(undefined);
export const headBranch = signal<string | null>(null);

export const commitList = signal<Array<GitCommitNode> | undefined>(undefined);
/** Hash of the commit that HEAD points to, or `null` when the repo has no commit. */
export const commitHead = signal<string | null>(null);
export const moreCommitsAvailable = signal<boolean>(false);

export const selectedBranch = signal<CommitBranchType | undefined>(undefined);
export const showRemoteBranch = signal<boolean>(true);
export const maxCommits = signal<number>(viewState.initialLoadCommits);

/**
 * Bump to refetch `loadBranches` and `loadCommits` in `lib/sync.ts`.
 * This refreshes `branchList`, `headBranch`, and the commit list.
 * Selections (`selectedRepo`, `selectedBranch`) stay unchanged.
 */
export const refreshToken = signal<number>(0);
