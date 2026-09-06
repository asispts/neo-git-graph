import path from "node:path";

import * as vscode from "vscode";

import { rpcNotify } from "@/extension/rpc/rpc-notify";
import { logger } from "@/old-extension/utils/logger";

const REFRESH_DELAY = 750;
const GIT_DATA = /^(HEAD|config|index|packed-refs|refs(?:\/.*)?)$/;

let selectRepo: ((repo: string) => void) | undefined;

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

    const refresh = (uri: vscode.Uri) => {
      const relativePath = path.relative(repo, uri.fsPath).split(path.sep).join("/");
      if (
        relativePath.startsWith("../") ||
        (relativePath.startsWith(".git/") && !GIT_DATA.test(relativePath.slice(5)))
      ) {
        return;
      }

      logger.log(`Git repository file changed: ${uri.fsPath}`);
      if (refreshTimer !== undefined) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        logger.log(`Git repository changed: ${repo}`);
        void rpcNotify.notify("repo.updated", { path: repo });
      }, REFRESH_DELAY);
    };

    watcher.onDidCreate(refresh);
    watcher.onDidChange(refresh);
    watcher.onDidDelete(refresh);
  };

  return new vscode.Disposable(() => {
    selectRepo = undefined;
    stop();
  });
}

export function selectWatchedRepo(repo: string): void {
  if (selectRepo === undefined) {
    return;
  }

  selectRepo(repo);
}
