import { signal } from "@preact/signals";

import type { BranchData, CommitBranchType, RepoData } from "@/webview/types";

export const repoList = signal<Array<RepoData> | undefined>(undefined);
export const selectedRepo = signal<string | undefined>(undefined);
export const branchList = signal<Array<BranchData> | undefined>(undefined);
export const headBranch = signal<string | null>(null);

export const selectedBranch = signal<CommitBranchType | undefined>(undefined);
export const showRemoteBranch = signal<boolean>(true);
export const maxCommits = signal<number>(viewState.initialLoadCommits);

/**
 * Bump to refetch `loadBranches` and `loadCommits` in `lib/sync.ts`.
 * This refreshes `branchList`, `headBranch`, and the commit list.
 * Selections (`selectedRepo`, `selectedBranch`) stay unchanged.
 */
export const refreshToken = signal<number>(0);
