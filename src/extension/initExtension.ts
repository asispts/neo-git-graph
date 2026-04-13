import * as vscode from "vscode";

import { AvatarManager } from "@/avatarManager";
import { GitClient, gitClientFactory } from "@/backend/gitClient";
import { buildExtensionUri } from "@/backend/utils/path";
import { config } from "@/config";
import { DiffDocProvider } from "@/diffDocProvider";
import { registerMessageHandlers } from "@/extension/messageHandler";
import { createRepoManager } from "@/extension/repoManager";
import { WebviewBridge, webviewBridgeFactory } from "@/extension/webviewBridge";
import { createWebviewPanel, WebviewPanel } from "@/extension/webviewPanel";
import { ExtensionState } from "@/extensionState";
import * as l10n from "@/l10n";
import { RepoFileWatcher } from "@/repoFileWatcher";
import { StatusBarItem } from "@/statusBarItem";

function registerViewCommand(
  ctx: vscode.ExtensionContext,
  repos: string[],
  extensionState: ExtensionState,
  statusBarItem: StatusBarItem,
  avatarManager: AvatarManager,
  gitClient: GitClient
) {
  const repoManager = createRepoManager(extensionState, statusBarItem, config);
  repoManager.setRepos(repos);

  let currentPanel: WebviewPanel | undefined;
  ctx.subscriptions.push(
    vscode.commands.registerCommand("neo-git-graph.view", () => {
      if (currentPanel) {
        currentPanel.reveal(vscode.window.activeTextEditor?.viewColumn);
        return;
      }

      const vsPanel = vscode.window.createWebviewPanel(
        "neo-git-graph",
        l10n.t("outputChannel.text"),
        vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            buildExtensionUri(ctx.extensionPath, "media"),
            buildExtensionUri(ctx.extensionPath, "out")
          ]
        }
      );

      let bridge!: WebviewBridge;
      const repoFileWatcher = new RepoFileWatcher(() => {
        if (vsPanel.visible) bridge.post({ command: "refresh" });
      });
      bridge = webviewBridgeFactory(vsPanel.webview, repoFileWatcher);
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
        panel: vsPanel,
        bridge,
        config,
        repoFileWatcher,
        extensionPath: ctx.extensionPath,
        extensionState,
        avatarManager,
        repoManager,
        onDispose: () => {
          currentPanel = undefined;
        },
        onPanelShown
      });
    })
  );
}

export function initExtension(ctx: vscode.ExtensionContext, repos: string[]) {
  const extensionState = new ExtensionState(ctx);
  const avatarManager = new AvatarManager(config.gitPath, extensionState);

  ctx.subscriptions.push(
    vscode.commands.registerCommand("neo-git-graph.clearAvatarCache", () => {
      avatarManager.clearCache();
    })
  );

  const gitClient = gitClientFactory(extensionState.getLastActiveRepo() ?? "", config.gitPath());
  ctx.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      DiffDocProvider.scheme,
      new DiffDocProvider(gitClient.getInstance)
    )
  );

  const statusBarItem = new StatusBarItem(ctx, config);
  registerViewCommand(ctx, repos, extensionState, statusBarItem, avatarManager, gitClient);

  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("neo-git-graph.showStatusBarItem")) {
        statusBarItem.refresh();
      } else if (e.affectsConfiguration("git.path")) {
        gitClient.setGitPath(config.gitPath());
      }
    })
  );
}
