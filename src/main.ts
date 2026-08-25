import * as vscode from "vscode";

import { EXTENSION_NAME } from "./extension/constants";
import { createViewCommand } from "./extension/view-command";
import { logger } from "./old-extension/utils/logger";

export function activate(ctx: vscode.ExtensionContext) {
  logger.init(ctx);

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  statusBarItem.name = EXTENSION_NAME;
  statusBarItem.command = "neo-git-graph.view";
  statusBarItem.text = `$(type-hierarchy) ${EXTENSION_NAME}`;
  statusBarItem.tooltip = vscode.l10n.t("View Git Graph");
  statusBarItem.show();

  ctx.subscriptions.push(statusBarItem);

  ctx.subscriptions.push(
    vscode.commands.registerCommand("neo-git-graph.view", createViewCommand(ctx))
  );
}
