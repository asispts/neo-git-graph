import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { config } from "@/config";
import type { InitExtension } from "@/extension/initExtension";
import { createMaxDepthTracker } from "@/extension/maxDepthTracker";
import * as l10n from "@/l10n";

type WatcherState = {
  disposed: boolean;
  disposables: vscode.Disposable[];
};

function dispose(state: WatcherState) {
  state.disposed = true;
  for (const d of state.disposables) d.dispose();
  state.disposables.length = 0;
}

async function check(
  ctx: vscode.ExtensionContext,
  state: WatcherState,
  onReposFound: InitExtension
) {
  const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());
  if (repoDirs.length === 0 || state.disposed) return;
  dispose(state);
  onReposFound(ctx, repoDirs);
}

export function watchForRepos(
  ctx: vscode.ExtensionContext,
  onReposFound: InitExtension
): { dispose(): void } {
  const maxDepth = createMaxDepthTracker(config.maxDepthOfRepoSearch());
  const gitWatcher = vscode.workspace.createFileSystemWatcher("**/.git");
  const state: WatcherState = { disposed: false, disposables: [gitWatcher] };

  state.disposables.push(
    gitWatcher.onDidCreate(() => check(ctx, state, onReposFound)),
    vscode.workspace.onDidChangeWorkspaceFolders(() => check(ctx, state, onReposFound)),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("neo-git-graph.maxDepthOfRepoSearch")) {
        if (maxDepth.increased(config.maxDepthOfRepoSearch())) {
          void check(ctx, state, onReposFound);
        }
      }
    }),
    vscode.commands.registerCommand("neo-git-graph.view", async () => {
      await vscode.window.showErrorMessage(l10n.t("statusBar.text"), {
        detail: l10n.t("error.noGitRepository"),
        modal: true
      });
    }),
    vscode.commands.registerCommand("neo-git-graph.clearAvatarCache", async () => {
      await vscode.window.showErrorMessage(l10n.t("statusBar.text"), {
        detail: l10n.t("error.noGitRepository"),
        modal: true
      });
    })
  );

  return { dispose: () => dispose(state) };
}
