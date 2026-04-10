import * as vscode from "vscode";

import { config } from "@/config";
import { bootstrap, findGitRepos } from "@/extension/bootstrap";

export async function activate(ctx: vscode.ExtensionContext) {
  const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);

  const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());
  if (repoDirs.length === 0) {
    return;
  }

  bootstrap(ctx, repoDirs);
}

export function deactivate() {}
