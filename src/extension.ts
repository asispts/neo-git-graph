import * as vscode from "vscode";

import { AvatarManager } from "./avatarManager";
import { createGitClientManager } from "./backend/features/gitClient";
import { buildExtensionUri } from "./backend/utils";
import { getConfig } from "./config";
import { DataSource } from "./dataSource";
import { DiffDocProvider } from "./diffDocProvider";
import { webviewBridgeFactory } from "./extension/webviewBridge";
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
  const gitManager = createGitClientManager(
    extensionState.getLastActiveRepo() ?? "",
    getConfig().gitPath()
  );

  context.subscriptions.push(
    outputChannel,
    vscode.commands.registerCommand("neo-git-graph.view", () => {
      const column = vscode.window.activeTextEditor?.viewColumn;
      if (GitGraphView.currentPanel) {
        GitGraphView.currentPanel.reveal(column);
        return;
      }
      const panel = vscode.window.createWebviewPanel(
        "neo-git-graph",
        "(neo) Git Graph",
        column ?? vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            buildExtensionUri(context.extensionPath, "media"),
            buildExtensionUri(context.extensionPath, "out")
          ]
        }
      );
      const bridge = webviewBridgeFactory(panel.webview);
      avatarManager.registerBridge(bridge.post.bind(bridge));
      new GitGraphView(
        panel,
        bridge,
        context.extensionPath,
        dataSource,
        extensionState,
        avatarManager,
        repoManager,
        gitManager
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
        gitManager.setGitPath(getConfig().gitPath());
      }
    }),
    repoManager
  );

  outputChannel.appendLine("Extension activated successfully");
}

export function deactivate() {}
