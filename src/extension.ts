import * as vscode from "vscode";

import { AvatarManager } from "./avatarManager";
import { gitBranchFactory } from "./backend/features/gitBranch";
import { gitClientFactory } from "./backend/features/gitClient";
import { gitTagFactory } from "./backend/features/gitTag";
import { buildExtensionUri } from "./backend/utils";
import { getConfig } from "./config";
import { DataSource } from "./dataSource";
import { DiffDocProvider } from "./diffDocProvider";
import { WebviewBridge, webviewBridgeFactory } from "./extension/webviewBridge";
import { createWebviewPanel, WebviewPanel } from "./extension/webviewPanel";
import { ExtensionState } from "./extensionState";
import { RepoFileWatcher } from "./repoFileWatcher";
import { RepoManager } from "./repoManager";
import { StatusBarItem } from "./statusBarItem";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("(neo) Git Graph");
  const extensionState = new ExtensionState(context);
  const dataSource = new DataSource();
  const avatarManager = new AvatarManager(dataSource, extensionState);
  const statusBarItem = new StatusBarItem(context);
  const repoManager = new RepoManager(dataSource, extensionState, statusBarItem);
  const gitClient = gitClientFactory(
    extensionState.getLastActiveRepo() ?? "",
    getConfig().gitPath()
  );
  const gitBranch = gitBranchFactory(gitClient.getInstance);
  const gitTag = gitTagFactory(gitClient.getInstance);

  let currentPanel: WebviewPanel | undefined;

  context.subscriptions.push(
    outputChannel,
    vscode.commands.registerCommand("neo-git-graph.view", () => {
      const column = vscode.window.activeTextEditor?.viewColumn;
      if (currentPanel) {
        currentPanel.reveal(column);
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
      let bridge!: WebviewBridge;
      const repoFileWatcher = new RepoFileWatcher(() => {
        if (panel.visible) bridge.post({ command: "refresh" });
      });
      bridge = webviewBridgeFactory(panel.webview, repoFileWatcher);
      avatarManager.registerBridge(bridge.post.bind(bridge));
      currentPanel = createWebviewPanel({
        panel,
        bridge,
        repoFileWatcher,
        extensionPath: context.extensionPath,
        dataSource,
        extensionState,
        avatarManager,
        repoManager,
        gitClient,
        gitBranch,
        gitTag,
        onDispose: () => {
          currentPanel = undefined;
        }
      });
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
        gitClient.setGitPath(getConfig().gitPath());
      }
    }),
    repoManager
  );

  outputChannel.appendLine("Extension activated successfully");
}

export function deactivate() {}
