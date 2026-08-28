import * as vscode from "vscode";

import { buildExtensionUri } from "@/backend/utils/path";
import { AvatarManager } from "@/old-extension/avatarManager";
import { Config } from "@/old-extension/config";
import { ExtensionState } from "@/old-extension/extensionState";
import { RepoFileWatcher } from "@/old-extension/repoFileWatcher";

import { RepoManager } from "./repoManager";
import { WebviewBridge } from "./webviewBridge";
import { buildWebviewHtml } from "./webviewHtml";

export function createWebviewPanel(opts: {
  panel: vscode.WebviewPanel;
  bridge: WebviewBridge;
  config: Config;
  repoFileWatcher: RepoFileWatcher;
  extensionPath: string;
  extensionState: ExtensionState;
  avatarManager: AvatarManager;
  repoManager: RepoManager;
  onDispose: () => void;
  onPanelShown: () => void;
}) {
  const {
    panel,
    bridge,
    config,
    repoFileWatcher,
    extensionPath,
    extensionState,
    avatarManager,
    repoManager,
    onDispose,
    onPanelShown
  } = opts;

  const disposables: vscode.Disposable[] = [];
  let isPanelVisible = true;

  panel.iconPath =
    config.tabIconColourTheme() === "colour"
      ? buildExtensionUri(extensionPath, "resources", "webview-icon.svg")
      : {
          light: buildExtensionUri(extensionPath, "resources", "webview-icon-light.svg"),
          dark: buildExtensionUri(extensionPath, "resources", "webview-icon-dark.svg")
        };

  function dispose() {
    onDispose();
    panel.dispose();
    avatarManager.deregisterBridge();
    repoFileWatcher.stop();
    while (disposables.length) {
      const x = disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  panel.webview.html = buildWebviewHtml({
    webview: panel.webview,
    config,
    extensionPath,
    extensionState,
    repoManager
  }).html;
  panel.onDidDispose(() => dispose(), null, disposables);
  panel.onDidChangeViewState(
    () => {
      if (panel.visible !== isPanelVisible) {
        if (panel.visible) {
          onPanelShown();
          bridge.post({ command: "refresh" });
        } else {
          repoFileWatcher.stop();
        }
        isPanelVisible = panel.visible;
      }
    },
    null,
    disposables
  );

  return {
    reveal(column?: vscode.ViewColumn) {
      panel.reveal(column);
    },
    dispose
  };
}

export type WebviewPanel = ReturnType<typeof createWebviewPanel>;
