import * as vscode from "vscode";

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

function processGitDir(type: FsWatcherEvent, uri: vscode.Uri): void {
  logger.log(`Git directory ${type}: ${uri.fsPath}`);
}
