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

  vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (e.affectsConfiguration("neo-git-graph.maxDepthOfRepoSearch")) {
      // const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());
    }
  });

  if (repoDirs.length > 0) {
    bootstrap(ctx, repoDirs);
    return;
  }

  ctx.subscriptions.push(waitForRepo(ctx));

  // Commands fallback
  ctx.subscriptions.push(
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
}

export function deactivate() {}
