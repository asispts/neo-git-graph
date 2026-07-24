import * as vscode from "vscode";

import { Config } from "./config";
import { EXTENSION_NAME } from "./extension/constant/const";
import { logger } from "./extension/utils/logger";

export class StatusBarItem {
  private statusBarItem: vscode.StatusBarItem;
  private numRepos: number = 0;
  private config: Config;

  constructor(context: vscode.ExtensionContext, config: Config) {
    this.config = config;
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    this.statusBarItem.name = EXTENSION_NAME;
    this.statusBarItem.command = "neo-git-graph.view";
    context.subscriptions.push(this.statusBarItem);
    logger.log(
      `StatusBarItem created (showStatusBarItem=${config.showStatusBarItem()}, numRepos=0)`
    );
  }

  public setNumRepos(numRepos: number) {
    logger.log(`StatusBarItem.setNumRepos(${numRepos})`);
    this.numRepos = numRepos;
    this.refresh();
  }

  public refresh() {
    const show = this.config.showStatusBarItem();
    if (show) {
      logger.log(`StatusBarItem.show() (showStatusBarItem=${show}, numRepos=${this.numRepos})`);
      if (this.numRepos === 0) {
        this.statusBarItem.text = `$(eye) ${EXTENSION_NAME}`;
        this.statusBarItem.tooltip = vscode.l10n.t("No Git repository found — watching for one");
      } else {
        this.statusBarItem.text = `$(type-hierarchy) ${EXTENSION_NAME}`;
        this.statusBarItem.tooltip = vscode.l10n.t("View Git Graph");
      }
      this.statusBarItem.show();
    } else {
      logger.log(`StatusBarItem.hide() (showStatusBarItem=${show}, numRepos=${this.numRepos})`);
      this.statusBarItem.hide();
    }
  }
}
