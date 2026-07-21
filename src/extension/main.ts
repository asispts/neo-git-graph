import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { config } from "@/config";
import { initExtension } from "@/extension/initExtension";
import { watchForRepos } from "@/extension/watchForRepos";
import * as l10n from "@/l10n";

export async function activate(ctx: vscode.ExtensionContext) {
  l10n.initL10n(ctx.extensionUri.fsPath);

  const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());

  if (repoDirs.length > 0) {
    initExtension(ctx, repoDirs);
    return;
  }

  ctx.subscriptions.push(watchForRepos(ctx, initExtension));
}

export function deactivate() {}
