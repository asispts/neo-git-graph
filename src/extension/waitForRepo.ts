import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { config } from "@/config";
import { bootstrap } from "@/extension/bootstrap";

export type WorkspaceApi = Pick<
  typeof vscode.workspace,
  "createFileSystemWatcher" | "onDidChangeWorkspaceFolders" | "workspaceFolders"
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
  bootstrap(ctx, repoDirs);
}

export function waitForRepo(
  ctx: vscode.ExtensionContext,
  workspace: WorkspaceApi = vscode.workspace
): { dispose(): void } {
  const gitWatcher = workspace.createFileSystemWatcher("**/.git");
  const state: WatcherState = { disposed: false, disposables: [gitWatcher] };

  state.disposables.push(gitWatcher.onDidCreate(() => check(ctx, workspace, state)));
  state.disposables.push(workspace.onDidChangeWorkspaceFolders(() => check(ctx, workspace, state)));

  return { dispose: () => dispose(state) };
}
