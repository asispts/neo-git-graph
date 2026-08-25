import * as vscode from "vscode";

import { AvatarManager } from "@/avatarManager";
import { gitClientFactory } from "@/backend/gitClient";
import { findGitRepos } from "@/backend/queries/repoSearch";
import { config } from "@/config";
import { DiffDocProvider } from "@/diffDocProvider";
import { ExtensionState } from "@/extensionState";
import { registerMessageHandlers } from "@/old-extension/messageHandler";
import { createRepoManager } from "@/old-extension/repoManager";
import { logger } from "@/old-extension/utils/logger";
import { WebviewBridge, webviewBridgeFactory } from "@/old-extension/webviewBridge";
import { RepoFileWatcher } from "@/repoFileWatcher";

export function createMessageProtocol(ctx: vscode.ExtensionContext) {
  const extensionState = new ExtensionState(ctx);
  const avatarManager = new AvatarManager(config.gitPath, extensionState);
  const gitClient = gitClientFactory(extensionState.getLastActiveRepo() ?? "", config.gitPath());
  const repoManager = createRepoManager(extensionState, config);
  const workspacePaths = (vscode.workspace.workspaceFolders ?? []).map(
    (folder) => folder.uri.fsPath
  );
  const ready = findGitRepos(workspacePaths, config.gitPath(), config.maxDepthOfRepoSearch()).then(
    (repos) => {
      repoManager.setRepos(repos);
      repoManager.sendRepos();
    },
    (error: unknown) => {
      logger.log(
        `Failed to find Git repositories: ${error instanceof Error ? error.message : String(error)}`
      );
      repoManager.sendRepos();
    }
  );

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
    ready,
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
          bridge.post({
            command: "loadRepos",
            repos: repoManager.getRepos(),
            lastActiveRepo: extensionState.getLastActiveRepo()
          });
          bridge.post({ command: "refresh" });
        } else {
          repoFileWatcher.stop();
        }
        isPanelVisible = panel.visible;
      });

      repoManager.registerViewCallback((repos) => {
        if (panel.visible) {
          bridge.post({
            command: "loadRepos",
            repos,
            lastActiveRepo: extensionState.getLastActiveRepo()
          });
        }
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
          repoManager.deregisterViewCallback();
        }
      };
    }
  };
}
