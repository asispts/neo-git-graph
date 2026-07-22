import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { config } from "@/config";
import { EXTENSION_NAME } from "@/extension/constant/const";
import type { InitExtension } from "@/extension/initExtension";
import { l10n } from "@/extension/l10n/l10n";
import { createMaxDepthTracker } from "@/extension/maxDepthTracker";
import { StatusBarItem } from "@/statusBarItem";

type WatcherState = {
  disposed: boolean;
  disposables: vscode.Disposable[];
};

function dispose(state: WatcherState) {
  state.disposed = true;
  for (const d of state.disposables) {
    d.dispose();
  }
  state.disposables.length = 0;
}

async function check(
  ctx: vscode.ExtensionContext,
  state: WatcherState,
  onReposFound: InitExtension,
  statusBarItem: StatusBarItem
) {
  if (state.disposed) {
    return;
  }
  const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());
  if (repoDirs.length === 0 || state.disposed) {
    return;
  }
  dispose(state);
  onReposFound(ctx, repoDirs, statusBarItem);
}

export function watchForRepos(
  ctx: vscode.ExtensionContext,
  onReposFound: InitExtension,
  statusBarItem: StatusBarItem
): { dispose(): void } {
  const maxDepth = createMaxDepthTracker(config.maxDepthOfRepoSearch());
  const gitWatcher = vscode.workspace.createFileSystemWatcher("**/.git");
  const state: WatcherState = { disposed: false, disposables: [gitWatcher] };

  state.disposables.push(
    gitWatcher.onDidCreate(() => check(ctx, state, onReposFound, statusBarItem)),
    vscode.workspace.onDidChangeWorkspaceFolders(() =>
      check(ctx, state, onReposFound, statusBarItem)
    ),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("neo-git-graph.maxDepthOfRepoSearch")) {
        if (maxDepth.increased(config.maxDepthOfRepoSearch())) {
          void check(ctx, state, onReposFound, statusBarItem);
        }
      }
    }),
    vscode.commands.registerCommand("neo-git-graph.view", async () => {
      await vscode.window.showErrorMessage(EXTENSION_NAME, {
        detail: l10n.t("noGitRepository"),
        modal: true
      });
    }),
    vscode.commands.registerCommand("neo-git-graph.clearAvatarCache", async () => {
      await vscode.window.showErrorMessage(EXTENSION_NAME, {
        detail: l10n.t("noGitRepository"),
        modal: true
      });
    })
  );

  return { dispose: () => dispose(state) };
}
