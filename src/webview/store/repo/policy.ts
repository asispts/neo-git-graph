import type { GitRepoSet } from "@/types";

export const ALL_BRANCHES = "";

export function pickRepo(
  repos: GitRepoSet,
  preferred: string | null,
  lastActiveRepo: string | null
): string | null {
  if (preferred !== null && Object.hasOwn(repos, preferred)) {
    return preferred;
  }
  if (lastActiveRepo !== null && Object.hasOwn(repos, lastActiveRepo)) {
    return lastActiveRepo;
  }
  return Object.keys(repos)[0] ?? null;
}

export function pickBranch(
  current: string | null,
  branches: string[],
  head: string | null,
  showCurrentBranchByDefault: boolean
): string {
  if (current !== null && (current === ALL_BRANCHES || branches.includes(current))) {
    return current;
  }
  return showCurrentBranchByDefault && head !== null ? head : ALL_BRANCHES;
}
