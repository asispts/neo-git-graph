import * as vscode from "vscode";

import { AvatarManager } from "../avatarManager";
import { GitBranch } from "../backend/features/gitBranch";
import { GitClient } from "../backend/features/gitClient";
import { GitTag } from "../backend/features/gitTag";
import { buildExtensionUri } from "../backend/utils";
import { getConfig } from "../config";
import { DataSource } from "../dataSource";
import { ExtensionState } from "../extensionState";
import { RepoFileWatcher } from "../repoFileWatcher";
import { RepoManager } from "../repoManager";
import { GitRepoSet } from "../types";
import { registerMessageHandlers } from "./messageHandler";
import { WebviewBridge } from "./webviewBridge";
import { buildWebviewHtml } from "./webviewHtml";

export function createWebviewPanel(opts: {
  panel: vscode.WebviewPanel;
  bridge: WebviewBridge;
  repoFileWatcher: RepoFileWatcher;
  extensionPath: string;
  dataSource: DataSource;
  extensionState: ExtensionState;
  avatarManager: AvatarManager;
  repoManager: RepoManager;
  gitClient: GitClient;
  gitBranch: GitBranch;
  gitTag: GitTag;
  onDispose: () => void;
}) {
  const {
    panel,
    bridge,
    repoFileWatcher,
    extensionPath,
    dataSource,
    extensionState,
    avatarManager,
    repoManager,
    gitClient,
    gitBranch,
    gitTag,
    onDispose
  } = opts;

  const disposables: vscode.Disposable[] = [];
  let isGraphViewLoaded = false;
  let isPanelVisible = true;
  let currentRepo: string | null = null;

  panel.iconPath =
    getConfig().tabIconColourTheme() === "colour"
      ? buildExtensionUri(extensionPath, "resources", "webview-icon.svg")
      : {
          light: buildExtensionUri(extensionPath, "resources", "webview-icon-light.svg"),
          dark: buildExtensionUri(extensionPath, "resources", "webview-icon-dark.svg")
        };

  function update() {
    const result = buildWebviewHtml({
      webview: panel.webview,
      extensionPath,
      extensionState,
      repoManager
    });
    panel.webview.html = result.html;
    isGraphViewLoaded = result.isGraphLoaded;
  }

  function dispose() {
    onDispose();
    panel.dispose();
    avatarManager.deregisterBridge();
    repoFileWatcher.stop();
    repoManager.deregisterViewCallback();
    while (disposables.length) {
      const x = disposables.pop();
      if (x) x.dispose();
    }
  }

  update();
  panel.onDidDispose(() => dispose(), null, disposables);
  panel.onDidChangeViewState(
    () => {
      if (panel.visible !== isPanelVisible) {
        if (panel.visible) {
          update();
        } else {
          currentRepo = null;
          repoFileWatcher.stop();
        }
        isPanelVisible = panel.visible;
      }
    },
    null,
    disposables
  );

  repoManager.registerViewCallback((repos: GitRepoSet, numRepos: number) => {
    if (!panel.visible) return;
    if ((numRepos === 0 && isGraphViewLoaded) || (numRepos > 0 && !isGraphViewLoaded)) {
      update();
    } else {
      bridge.post({
        command: "loadRepos",
        repos,
        lastActiveRepo: extensionState.getLastActiveRepo()
      });
    }
  });

  registerMessageHandlers(bridge, {
    dataSource,
    gitClient,
    gitBranch,
    gitTag,
    repoManager,
    extensionState,
    avatarManager,
    repoFileWatcher,
    getCurrentRepo: () => currentRepo,
    setCurrentRepo: (r) => {
      currentRepo = r;
    }
  });

  return {
    reveal(column?: vscode.ViewColumn) {
      panel.reveal(column);
    },
    dispose
  };
}

export type WebviewPanel = ReturnType<typeof createWebviewPanel>;
