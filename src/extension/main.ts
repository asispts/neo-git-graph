import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { config } from "@/config";
import { bootstrap } from "@/extension/bootstrap";
import { waitForRepo } from "@/extension/waitForRepo";

export async function activate(ctx: vscode.ExtensionContext) {
  const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);

  const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());
  if (repoDirs.length <= 0) {
    ctx.subscriptions.push(waitForRepo(ctx));
    return;
  }

  bootstrap(ctx, repoDirs);
}

export function deactivate() {}
