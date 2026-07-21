import * as path from "path";

import * as vscode from "vscode";

import { AvatarManager } from "@/avatarManager";
import { GitClient, gitClientFactory } from "@/backend/gitClient";
import { findGitRepos } from "@/backend/queries/repoSearch";
import { buildExtensionUri } from "@/backend/utils/path";
import { config } from "@/config";
import { DiffDocProvider } from "@/diffDocProvider";
import { createMaxDepthTracker } from "@/extension/maxDepthTracker";
import { registerMessageHandlers } from "@/extension/messageHandler";
import { createRepoManager, RepoManager } from "@/extension/repoManager";
import { WebviewBridge, webviewBridgeFactory } from "@/extension/webviewBridge";
import { createWebviewPanel, WebviewPanel } from "@/extension/webviewPanel";
import { ExtensionState } from "@/extensionState";
import * as l10n from "@/l10n";
import { RepoFileWatcher } from "@/repoFileWatcher";
import { StatusBarItem } from "@/statusBarItem";

export type InitExtension = typeof initExtension;

function registerViewCommand(
  ctx: vscode.ExtensionContext,
  repoManager: RepoManager,
  extensionState: ExtensionState,
  avatarManager: AvatarManager,
  gitClient: GitClient
) {
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

  const maxDepth = createMaxDepthTracker(config.maxDepthOfRepoSearch());
  const statusBarItem = new StatusBarItem(ctx, config);
  const repoManager = createRepoManager(extensionState, statusBarItem, config);
  repoManager.setRepos(repos);
  registerViewCommand(ctx, repoManager, extensionState, avatarManager, gitClient);

  const gitWatcher = vscode.workspace.createFileSystemWatcher("**/.git");
  ctx.subscriptions.push(
    gitWatcher,
    gitWatcher.onDidCreate((uri) => {
      const repoPath = path.dirname(uri.fsPath);
      if (repoManager.addRepo(repoPath)) repoManager.sendRepos();
    }),
    gitWatcher.onDidDelete((uri) => {
      const repoPath = path.dirname(uri.fsPath);
      if (repoManager.removeReposWithinFolder(repoPath)) repoManager.sendRepos();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(async (e) => {
      if (e.added.length > 0) {
        const paths = e.added.map((f) => f.uri.fsPath);
        const repoDirs = await findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch());
        for (const repo of repoDirs) repoManager.addRepo(repo);
        if (repoDirs.length > 0) repoManager.sendRepos();
      }
      if (e.removed.length > 0) {
        let changes = false;
        for (const folder of e.removed) {
          if (repoManager.removeReposWithinFolder(folder.uri.fsPath)) changes = true;
        }
        if (changes) repoManager.sendRepos();
      }
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("neo-git-graph.showStatusBarItem")) {
        statusBarItem.refresh();
      } else if (e.affectsConfiguration("git.path")) {
        gitClient.setGitPath(config.gitPath());
      } else if (e.affectsConfiguration("neo-git-graph.maxDepthOfRepoSearch")) {
        if (maxDepth.increased(config.maxDepthOfRepoSearch())) {
          const paths = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
          void findGitRepos(paths, config.gitPath(), config.maxDepthOfRepoSearch()).then(
            (repoDirs) => {
              if (repoDirs.length > 0) {
                repoManager.setRepos(repoDirs);
                repoManager.sendRepos();
              }
            }
          );
        }
      }
    })
  );
}
