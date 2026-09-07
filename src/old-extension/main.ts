import * as vscode from "vscode";

import { findGitRepos } from "@/backend/queries/repoSearch";
import { getGitVersion } from "@/backend/utils/git";
import { config } from "@/old-extension/config";
import { initExtension } from "@/old-extension/initExtension";
import { StatusBarItem } from "@/old-extension/statusBarItem";
import { legacyLogger } from "@/old-extension/utils/logger";
import { watchForRepos } from "@/old-extension/watchForRepos";

export async function activate(ctx: vscode.ExtensionContext) {
  legacyLogger.init(ctx);
  legacyLogger.log("Starting Neo Git Graph ...");

  const gitPath = config.gitPath();
  const gitVersion = await getGitVersion(gitPath);
  if (gitVersion) {
    legacyLogger.log(`Using git (version: ${gitVersion})`);
  } else {
    legacyLogger.log("Failed to detect git version");
  }

  const statusBarItem = new StatusBarItem(ctx, config);
  statusBarItem.refresh();

  const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  legacyLogger.log(`Searching workspace for new repos (${paths.length} folder(s)) ...`);
  const repoDirs = await findGitRepos(paths, gitPath, config.maxDepthOfRepoSearch());

  if (repoDirs.length > 0) {
    legacyLogger.log(`Found ${repoDirs.length} repo(s)`);
    initExtension(ctx, repoDirs, statusBarItem);
    legacyLogger.log("Started Neo Git Graph - Ready to use!");
    return;
  }

  legacyLogger.log("No repos found");
  legacyLogger.log("Watching for new repos ...");
  ctx.subscriptions.push(watchForRepos(ctx, initExtension, statusBarItem));
}

export function deactivate() {}
