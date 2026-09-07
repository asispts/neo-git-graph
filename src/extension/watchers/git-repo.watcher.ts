import path from "node:path";

import * as vscode from "vscode";

import { rpcNotify } from "@/extension/rpc/rpc-notify";
import { logger } from "@/extension/util/logger";

const REFRESH_DELAY = 750;
const GIT_DATA = /^(HEAD|config|index|packed-refs|refs(?:\/.*)?)$/;

let selectRepo: ((repo: string) => void) | undefined;
let muteDepth = 0;
let resumeAt = 0;

export function watchGitRepo(): vscode.Disposable {
  let repoPath: string | undefined;
  let watcher: vscode.FileSystemWatcher | undefined;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    watcher?.dispose();
    watcher = undefined;
    if (refreshTimer !== undefined) {
      clearTimeout(refreshTimer);
      refreshTimer = undefined;
    }
  };

  selectRepo = (repo: string) => {
    if (repo === repoPath && watcher !== undefined) {
      return;
    }

    stop();
    repoPath = repo;
    watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(repo, "**/*"));

    const refresh = (event: "created" | "changed" | "deleted", uri: vscode.Uri) => {
      if (muteDepth > 0 || Date.now() < resumeAt) {
        return;
      }

      const relativePath = path.relative(repo, uri.fsPath).split(path.sep).join("/");
      if (
        relativePath.startsWith("../") ||
        (relativePath.startsWith(".git/") && !GIT_DATA.test(relativePath.slice(5)))
      ) {
        return;
      }

      logger.debug(`Repository file ${event}: ${uri.fsPath}`);
      if (refreshTimer !== undefined) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        logger.debug(`Sending repo.updated notification: ${repo}`);
        void rpcNotify.notify("repo.updated", { path: repo });
      }, REFRESH_DELAY);
    };

    watcher.onDidCreate((uri) => refresh("created", uri));
    watcher.onDidChange((uri) => refresh("changed", uri));
    watcher.onDidDelete((uri) => refresh("deleted", uri));
  };

  return new vscode.Disposable(() => {
    selectRepo = undefined;
    muteDepth = 0;
    resumeAt = 0;
    stop();
  });
}

export function selectWatchedRepo(repo: string): void {
  if (selectRepo === undefined) {
    return;
  }

  selectRepo(repo);
}

export function muteGitRepoWatcher(): void {
  muteDepth++;
}

export function unmuteGitRepoWatcher(): void {
  if (muteDepth === 0) {
    return;
  }

  muteDepth--;
  if (muteDepth === 0) {
    resumeAt = Date.now() + 1500;
  }
}
