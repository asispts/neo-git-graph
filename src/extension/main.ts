import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { getGitVersion } from "@/backend/utils/git";
import { config } from "@/config";
import { initExtension } from "@/extension/initExtension";
import { watchForRepos } from "@/extension/watchForRepos";
import * as l10n from "@/l10n";
import * as logger from "@/logger";

export async function activate(ctx: vscode.ExtensionContext) {
  logger.initLogger(ctx);
  logger.log("Starting Neo Git Graph ...");

  l10n.initL10n(ctx.extensionUri.fsPath);

  const gitPath = config.gitPath();
  const gitVersion = await getGitVersion(gitPath);
  if (gitVersion) {
    logger.log(`Using git (version: ${gitVersion})`);
  } else {
    logger.log("Failed to detect git version");
  }

  const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  logger.log(`Searching workspace for new repos (${paths.length} folder(s)) ...`);
  const repoDirs = await findGitRepos(paths, gitPath, config.maxDepthOfRepoSearch());

  if (repoDirs.length > 0) {
    logger.log(`Found ${repoDirs.length} repo(s)`);
    initExtension(ctx, repoDirs);
    logger.log("Started Neo Git Graph - Ready to use!");
    return;
  }

  logger.log("No repos found");
  logger.log("Watching for new repos ...");
  ctx.subscriptions.push(watchForRepos(ctx, initExtension));
}

export function deactivate() {}
