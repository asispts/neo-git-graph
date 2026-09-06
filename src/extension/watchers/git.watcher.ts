import path from "node:path";

import * as vscode from "vscode";

import { rpcNotify } from "@/extension/rpc/rpc-notify";
import { createDebouncer, type FsWatcherEvent } from "@/extension/util/debounce";
import { logger } from "@/old-extension/utils/logger";

export function watchGitDir(): vscode.Disposable {
  const debouncer = createDebouncer();
  const watcher = vscode.workspace.createFileSystemWatcher("**/.git", false, true, false);
  const createListener = watcher.onDidCreate((uri) =>
    debouncer.debounce("created", uri, processGitDir)
  );
  const deleteListener = watcher.onDidDelete((uri) =>
    debouncer.debounce("deleted", uri, processGitDir)
  );
  return vscode.Disposable.from(watcher, createListener, deleteListener, debouncer);
}

async function processGitDir(type: FsWatcherEvent, uri: vscode.Uri) {
  logger.log(`Git directory ${type}: ${uri.fsPath}`);
  const repoPath = path.dirname(uri.fsPath);

  if (type === "created") {
    await rpcNotify.notify("repo.changed", {
      type,
      repo: {
        name: path.basename(repoPath),
        path: repoPath
      }
    });
    return;
  }

  await rpcNotify.notify("repo.changed", { type, path: repoPath });
}
