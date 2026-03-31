import * as vscode from "vscode";

import { Config } from "./config";

export class StatusBarItem {
  private statusBarItem: vscode.StatusBarItem;
  private numRepos: number = 0;
  private config: Config;

  constructor(context: vscode.ExtensionContext, config: Config) {
    this.config = config;
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    this.statusBarItem.text = "(neo) Git Graph";
    this.statusBarItem.tooltip = "View Git Graph";
    this.statusBarItem.command = "neo-git-graph.view";
    context.subscriptions.push(this.statusBarItem);
  }

  public setNumRepos(numRepos: number) {
    this.numRepos = numRepos;
    this.refresh();
  }

  public refresh() {
    if (this.config.showStatusBarItem() && this.numRepos > 0) {
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }
}
