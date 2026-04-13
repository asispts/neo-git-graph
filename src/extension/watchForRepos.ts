import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { config } from "@/config";
import { initExtension } from "@/extension/initExtension";
import * as l10n from "@/l10n";

export type WorkspaceApi = Pick<
  typeof vscode.workspace,
  | "createFileSystemWatcher"
  | "onDidChangeWorkspaceFolders"
  | "onDidChangeConfiguration"
  | "workspaceFolders"
>;

type WatcherState = {
  disposed: boolean;
  disposables: vscode.Disposable[];
};

function dispose(state: WatcherState) {
  state.disposed = true;
  for (const d of state.disposables) d.dispose();
  state.disposables.length = 0;
}

async function check(ctx: vscode.ExtensionContext, workspace: WorkspaceApi, state: WatcherState) {
  const paths = (workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());
  if (repoDirs.length === 0 || state.disposed) return;
  dispose(state);
  initExtension(ctx, repoDirs);
}

export function watchForRepos(
  ctx: vscode.ExtensionContext,
  workspace: WorkspaceApi = vscode.workspace
): { dispose(): void } {
  const gitWatcher = workspace.createFileSystemWatcher("**/.git");
  const state: WatcherState = { disposed: false, disposables: [gitWatcher] };

  state.disposables.push(
    gitWatcher.onDidCreate(() => check(ctx, workspace, state)),
    workspace.onDidChangeWorkspaceFolders(() => check(ctx, workspace, state)),
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("neo-git-graph.maxDepthOfRepoSearch")) {
        void check(ctx, workspace, state);
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
