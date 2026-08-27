import * as vscode from "vscode";

import { AvatarManager } from "@/avatarManager";
import { gitClientFactory } from "@/backend/gitClient";
import { config } from "@/config";
import { DiffDocProvider } from "@/diffDocProvider";
import { ExtensionState } from "@/extensionState";
import { registerMessageHandlers } from "@/old-extension/messageHandler";
import { createRepoManager } from "@/old-extension/repoManager";
import { WebviewBridge, webviewBridgeFactory } from "@/old-extension/webviewBridge";
import { RepoFileWatcher } from "@/repoFileWatcher";

export function createMessageProtocol(ctx: vscode.ExtensionContext) {
  const extensionState = new ExtensionState(ctx);
  const avatarManager = new AvatarManager(config.gitPath, extensionState);
  const gitClient = gitClientFactory(extensionState.getLastActiveRepo() ?? "", config.gitPath());
  const repoManager = createRepoManager(extensionState, config);

  ctx.subscriptions.push(
    vscode.commands.registerCommand("neo-git-graph.clearAvatarCache", () => {
      avatarManager.clearCache();
    }),
    vscode.workspace.registerTextDocumentContentProvider(
      DiffDocProvider.scheme,
      new DiffDocProvider(gitClient.getInstance)
    )
  );

  return {
    attach(panel: vscode.WebviewPanel) {
      let isPanelVisible = panel.visible;
      let disposed = false;
      let bridge: WebviewBridge;
      const repoFileWatcher = new RepoFileWatcher(() => {
        if (panel.visible) {
          bridge.post({ command: "refresh" });
        }
      });
      bridge = webviewBridgeFactory(panel.webview, repoFileWatcher);
      avatarManager.registerBridge(bridge.post);

      const { onPanelShown } = registerMessageHandlers(bridge, {
        config,
        gitClient,
        repoManager,
        extensionState,
        avatarManager,
        repoFileWatcher
      });
      const viewStateListener = panel.onDidChangeViewState(() => {
        if (panel.visible === isPanelVisible) {
          return;
        }
        if (panel.visible) {
          onPanelShown();
          bridge.post({ command: "refresh" });
        } else {
          repoFileWatcher.stop();
        }
        isPanelVisible = panel.visible;
      });

      return {
        dispose() {
          if (disposed) {
            return;
          }
          disposed = true;
          bridge.dispose();
          viewStateListener.dispose();
          avatarManager.deregisterBridge();
          repoFileWatcher.stop();
        }
      };
    }
  };
}
