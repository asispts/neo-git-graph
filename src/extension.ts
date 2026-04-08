import * as vscode from "vscode";

import { AvatarManager } from "./avatarManager";
import { gitClientFactory } from "./backend/gitClient";
import { buildExtensionUri } from "./backend/utils/path.util";
import { config } from "./config";
import { DiffDocProvider } from "./diffDocProvider";
import { registerMessageHandlers } from "./extension/messageHandler";
import { WebviewBridge, webviewBridgeFactory } from "./extension/webviewBridge";
import { createWebviewPanel, WebviewPanel } from "./extension/webviewPanel";
import { ExtensionState } from "./extensionState";
import * as l10n from "./l10n";
import { initL10n } from "./l10n";
import { RepoFileWatcher } from "./repoFileWatcher";
import { RepoManager } from "./repoManager";
import { StatusBarItem } from "./statusBarItem";

export function activate(context: vscode.ExtensionContext) {
  initL10n(context.extensionPath);
  const outputChannel = vscode.window.createOutputChannel(l10n.t("outputChannel.text"));
  const extensionState = new ExtensionState(context);
  const avatarManager = new AvatarManager(config.gitPath, extensionState);
  const statusBarItem = new StatusBarItem(context, config);
  const gitClient = gitClientFactory(extensionState.getLastActiveRepo() ?? "", config.gitPath());
  const repoManager = new RepoManager(extensionState, statusBarItem, config);
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
        l10n.t("outputChannel.text"),
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
      const { onPanelShown } = registerMessageHandlers(bridge, {
        config,
        gitClient,
        repoManager,
        extensionState,
        avatarManager,
        repoFileWatcher
      });
      currentPanel = createWebviewPanel({
        panel,
        bridge,
        config,
        repoFileWatcher,
        extensionPath: context.extensionPath,
        extensionState,
        avatarManager,
        repoManager,
        onDispose: () => {
          currentPanel = undefined;
        },
        onPanelShown
      });
    }),
    vscode.commands.registerCommand("neo-git-graph.clearAvatarCache", () => {
      avatarManager.clearCache();
    }),
    vscode.workspace.registerTextDocumentContentProvider(
      DiffDocProvider.scheme,
      new DiffDocProvider(gitClient.getInstance)
    ),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("neo-git-graph.showStatusBarItem")) {
        statusBarItem.refresh();
      } else if (e.affectsConfiguration("neo-git-graph.maxDepthOfRepoSearch")) {
        repoManager.maxDepthOfRepoSearchChanged();
      } else if (e.affectsConfiguration("git.path")) {
        gitClient.setGitPath(config.gitPath());
      }
    }),
    repoManager
  );

  outputChannel.appendLine("Extension activated successfully");
}

export function deactivate() {}
