import * as vscode from "vscode";
import { AvatarManager } from "./avatarManager";
import { DataSource } from "./dataSource";
import { DiffDocProvider } from "./diffDocProvider";
import { ExtensionState } from "./extensionState";
import { GitGraphView } from "./gitGraphView";
import { RepoManager } from "./repoManager";
import { StatusBarItem } from "./statusBarItem";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("(neo) Git Graph");
  const extensionState = new ExtensionState(context);
  const dataSource = new DataSource();
  const avatarManager = new AvatarManager(dataSource, extensionState);
  const statusBarItem = new StatusBarItem(context);
  const repoManager = new RepoManager(dataSource, extensionState, statusBarItem);

  context.subscriptions.push(
    outputChannel,
    vscode.commands.registerCommand("neo-git-graph.view", () => {
      GitGraphView.createOrShow(
        context.extensionPath,
        dataSource,
        extensionState,
        avatarManager,
        repoManager
      );
    }),
    vscode.commands.registerCommand("neo-git-graph.clearAvatarCache", () => {
      avatarManager.clearCache();
    }),
    vscode.workspace.registerTextDocumentContentProvider(
      DiffDocProvider.scheme,
      new DiffDocProvider(dataSource)
    ),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("neo-git-graph.showStatusBarItem")) {
        statusBarItem.refresh();
      } else if (e.affectsConfiguration("neo-git-graph.dateType")) {
        dataSource.generateGitCommandFormats();
      } else if (e.affectsConfiguration("neo-git-graph.maxDepthOfRepoSearch")) {
        repoManager.maxDepthOfRepoSearchChanged();
      } else if (e.affectsConfiguration("git.path")) {
        dataSource.registerGitPath();
      }
    }),
    repoManager
  );

  outputChannel.appendLine("Extension activated successfully");
  vscode.window.showInformationMessage("(neo) Git Graph extension loaded");
}

export function deactivate() {}
