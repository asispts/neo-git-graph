import { computed, effect } from "@preact/signals";

import { SHOW_ALL_BRANCHES } from "@/webview/constants";
import {
  actionRequest,
  clipboardRequest,
  diffRequest,
  expandedCommit,
  maxCommits,
  refreshToken,
  selectedBranch,
  selectedRepo,
  showRemoteBranch
} from "@/webview/lib/stores";
import { vscode } from "@/webview/lib/vscode";

export const branchQuery = computed(() => {
  const repo = selectedRepo.value;
  if (repo === undefined) {
    return null;
  }

  return {
    repo,
    showRemoteBranches: showRemoteBranch.value,
    token: refreshToken.value
  };
});

export const commitQuery = computed(() => {
  const repo = selectedRepo.value;
  const branch = selectedBranch.value;
  if (repo === undefined || branch === undefined) {
    return null;
  }

  return {
    repo,
    branch,
    showRemoteBranches: showRemoteBranch.value,
    maxCommits: maxCommits.value,
    token: refreshToken.value
  };
});

export const commitDetailsQuery = computed(() => {
  const repo = selectedRepo.value;
  const commitHash = expandedCommit.value;
  if (repo === undefined || commitHash === null) {
    return null;
  }

  return { repo, commitHash };
});

export function startSync() {
  effect(() => {
    const repo = selectedRepo.value;
    if (repo === undefined) {
      return;
    }

    vscode.postMessage({ command: "selectRepo", repo });
  });

  effect(() => {
    const query = branchQuery.value;
    if (query === null) {
      return;
    }

    vscode.postMessage({
      command: "loadBranches",
      repo: query.repo,
      showRemoteBranches: query.showRemoteBranches,
      hard: true
    });
  });

  effect(() => {
    const query = commitQuery.value;
    if (query === null) {
      return;
    }

    vscode.postMessage({
      command: "loadCommits",
      repo: query.repo,
      branchName: query.branch === SHOW_ALL_BRANCHES ? "" : query.branch,
      maxCommits: query.maxCommits,
      showRemoteBranches: query.showRemoteBranches,
      hard: true
    });
  });

  effect(() => {
    const query = commitDetailsQuery.value;
    if (query === null) {
      return;
    }

    vscode.postMessage({
      command: "commitDetails",
      repo: query.repo,
      commitHash: query.commitHash
    });
  });

  effect(() => {
    const request = clipboardRequest.value;
    if (request === null) {
      return;
    }

    vscode.postMessage({
      command: "copyToClipboard",
      type: request.type,
      data: request.data
    });
  });

  effect(() => {
    const request = actionRequest.value;
    if (request === null) {
      return;
    }

    vscode.postMessage(request.action);
  });

  effect(() => {
    const request = diffRequest.value;
    if (request === null) {
      return;
    }

    vscode.postMessage({
      command: "viewDiff",
      repo: request.repo,
      commitHash: request.commitHash,
      oldFilePath: request.file.oldFilePath,
      newFilePath: request.file.newFilePath,
      type: request.file.type
    });
  });
}
