import { signal } from "@preact/signals";

import type { GitRepoSet } from "@/types";

export const repos = signal<GitRepoSet>({});
export const currentRepo = signal<string | null>(null);
export const attachedRepo = signal<string | null>(null);
export const branches = signal<string[]>([]);
export const branchHead = signal<string | null>(null);
export const currentBranch = signal<string | null>(null);
export const showRemoteBranches = signal(true);

export function resetRepoState(): void {
  repos.value = {};
  currentRepo.value = null;
  attachedRepo.value = null;
  branches.value = [];
  branchHead.value = null;
  currentBranch.value = null;
  showRemoteBranches.value = true;
}
