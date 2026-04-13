import * as vscode from "vscode";

import { AvatarManager } from "@/avatarManager";
import { gitClientFactory } from "@/backend/gitClient";
import { buildExtensionUri } from "@/backend/utils/path";
import { config } from "@/config";
import { DiffDocProvider } from "@/diffDocProvider";
import { ExtensionState } from "@/extensionState";
import { initL10n } from "@/l10n";
import * as l10n from "@/l10n";
import { RepoFileWatcher } from "@/repoFileWatcher";
import { StatusBarItem } from "@/statusBarItem";

import { registerMessageHandlers } from "./messageHandler";
import { createRepoManager } from "./repoManager";
import { webviewBridgeFactory, WebviewBridge } from "./webviewBridge";
import { createWebviewPanel } from "./webviewPanel";

export type PanelHandle = {
  reveal(): void;
};

export function viewGitGraphCommand(
  panelFactory: (onDispose: () => void) => PanelHandle
): () => void {
  let currentPanel: PanelHandle | undefined;

  return () => {
    if (currentPanel) {
      currentPanel.reveal();
      return;
    }
    currentPanel = panelFactory(() => {
      currentPanel = undefined;
    });
  };
}

export function bootstrap(ctx: vscode.ExtensionContext, repos: string[]): void {
  initL10n(ctx.extensionPath);
  const extensionState = new ExtensionState(ctx);
  const statusBarItem = new StatusBarItem(ctx, config);
  const gitClient = gitClientFactory(extensionState.getLastActiveRepo() ?? "", config.gitPath());
  const avatarManager = new AvatarManager(config.gitPath, extensionState);
  const repoManager = createRepoManager(extensionState, statusBarItem, config);

  for (const repo of repos) {
    repoManager.addRepo(repo);
  }

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "neo-git-graph.view",
      viewGitGraphCommand((onDispose) => {
        const column = vscode.window.activeTextEditor?.viewColumn;
        const vsPanel = vscode.window.createWebviewPanel(
          "neo-git-graph",
          l10n.t("outputChannel.text"),
          column ?? vscode.ViewColumn.One,
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

        return createWebviewPanel({
          panel: vsPanel,
          bridge,
          config,
          repoFileWatcher,
          extensionPath: ctx.extensionPath,
          extensionState,
          avatarManager,
          repoManager,
          onDispose,
          onPanelShown
        });
      })
    )
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand("neo-git-graph.clearAvatarCache", () => {
      avatarManager.clearCache();
    })
  );

  ctx.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      DiffDocProvider.scheme,
      new DiffDocProvider(gitClient.getInstance)
    )
  );
}
