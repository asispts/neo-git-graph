import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { config } from "@/config";
import { bootstrap } from "@/extension/bootstrap";
import { waitForRepo } from "@/extension/waitForRepo";
import * as l10n from "@/l10n";

export async function activate(ctx: vscode.ExtensionContext) {
  l10n.initL10n(ctx.extensionUri.fsPath);

  const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());

  if (repoDirs.length > 0) {
    bootstrap(ctx, repoDirs);
    return;
  }

  ctx.subscriptions.push(waitForRepo(ctx));
}

export function deactivate() {}
