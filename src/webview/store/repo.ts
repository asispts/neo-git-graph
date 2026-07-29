import { computed, signal } from "@preact/signals";

import type { GitRepoSet } from "@/types";
import { onMessage, readState, sendMessage, writeState } from "@/webview/bridge";
import { config } from "@/webview/config";

const ALL_BRANCHES = "";
const REMOTE_PREFIX = "remotes/";

type PersistedState = {
  currentRepo: string | null;
  currentBranch: string | null;
  showRemoteBranches: boolean;
};

export const repos = signal<GitRepoSet>({});
export const currentRepo = signal<string | null>(null);
export const branches = signal<string[]>([]);
export const branchHead = signal<string | null>(null);
export const currentBranch = signal<string | null>(null);
export const showRemoteBranches = signal(true);

export const repoOptions = computed(() =>
  Object.keys(repos.value).map((path) => ({
    label: path.split("/").pop() ?? path,
    value: path
  }))
);

export const branchOptions = computed(() => [
  { label: "Show All", value: ALL_BRANCHES },
  ...branches.value.map((branch) => ({
    label: branch.startsWith(REMOTE_PREFIX) ? branch.substring(REMOTE_PREFIX.length) : branch,
    value: branch
  }))
]);

let attached = false;

function persist(): void {
  writeState<PersistedState>({
    currentRepo: currentRepo.value,
    currentBranch: currentBranch.value,
    showRemoteBranches: showRemoteBranches.value
  });
}

function requestBranches(hard: boolean): void {
  sendMessage({
    command: "loadBranches",
    showRemoteBranches: showRemoteBranches.value,
    hard
  });
}

function attachRepo(repo: string): void {
  attached = true;
  currentRepo.value = repo;
  persist();
  sendMessage({ command: "selectRepo", repo });
  requestBranches(true);
}

export function selectRepo(repo: string): void {
  if (repo === currentRepo.value) {
    return;
  }
  currentBranch.value = null;
  attachRepo(repo);
}

export function selectBranch(branch: string): void {
  currentBranch.value = branch;
  persist();
}

export function setShowRemoteBranches(value: boolean): void {
  showRemoteBranches.value = value;
  persist();
  requestBranches(true);
}

export function refresh(): void {
  sendMessage({ command: "loadRepos", check: true });
  requestBranches(true);
}

function pickRepo(next: GitRepoSet, lastActiveRepo: string | null): string | null {
  const active = currentRepo.value;
  if (active !== null && Object.hasOwn(next, active)) {
    return active;
  }
  if (lastActiveRepo !== null && Object.hasOwn(next, lastActiveRepo)) {
    return lastActiveRepo;
  }
  return Object.keys(next)[0] ?? null;
}

onMessage("loadRepos", (msg) => {
  repos.value = msg.repos;

  const repo = pickRepo(msg.repos, msg.lastActiveRepo);
  if (repo === null) {
    attached = false;
    currentRepo.value = null;
    currentBranch.value = null;
    branches.value = [];
    branchHead.value = null;
    persist();
    return;
  }

  if (repo !== currentRepo.value) {
    currentBranch.value = null;
    attachRepo(repo);
  } else if (!attached) {
    attachRepo(repo);
  }
});

onMessage("loadBranches", (msg) => {
  if (!msg.isRepo) {
    return;
  }

  branches.value = msg.branches;
  branchHead.value = msg.head;

  const active = currentBranch.value;
  if (active === null || (active !== ALL_BRANCHES && !msg.branches.includes(active))) {
    currentBranch.value =
      config.showCurrentBranchByDefault && msg.head !== null ? msg.head : ALL_BRANCHES;
  }
  persist();
});

onMessage("refresh", () => {
  requestBranches(false);
});

export function bootstrap(): void {
  const saved = readState<PersistedState>();
  if (saved) {
    currentRepo.value = saved.currentRepo;
    currentBranch.value = saved.currentBranch;
    showRemoteBranches.value = saved.showRemoteBranches;
  }
  sendMessage({ command: "loadRepos", check: false });
}

export function resetStore(): void {
  attached = false;
  repos.value = {};
  currentRepo.value = null;
  branches.value = [];
  branchHead.value = null;
  currentBranch.value = null;
  showRemoteBranches.value = true;
}
