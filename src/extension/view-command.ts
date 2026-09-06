import * as vscode from "vscode";

import { extConfig } from "./config";
import { EXTENSION_NAME } from "./constants";
import { createWevbviewHtml } from "./html";
import { createMessageProtocol } from "./legacy";
import { initRpcNotify } from "./rpc/rpc-notify";
import { createRpcServer } from "./rpc/rpc-server";
import { watchGitDir } from "./watchers/git.watcher";

export function createViewCommand(ctx: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  const messageProtocol = createMessageProtocol(ctx);
  const rpcServer = createRpcServer();

  return () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.window.activeTextEditor?.viewColumn);
      return;
    }

    const webPanel = vscode.window.createWebviewPanel(
      "neo-git-graph",
      EXTENSION_NAME,
      vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(ctx.extensionUri, "media"),
          vscode.Uri.joinPath(ctx.extensionUri, "out")
        ]
      }
    );

    webPanel.iconPath =
      extConfig.tabIconColourTheme() === "colour"
        ? vscode.Uri.joinPath(ctx.extensionUri, "resources", "webview-icon.svg")
        : {
            light: vscode.Uri.joinPath(ctx.extensionUri, "resources", "webview-icon-light.svg"),
            dark: vscode.Uri.joinPath(ctx.extensionUri, "resources", "webview-icon-dark.svg")
          };

    const messageProtocolAttachment = messageProtocol.attach(webPanel);
    const rpcListener = rpcServer.attach(webPanel.webview);
    const rpcNotifier = initRpcNotify(webPanel.webview);
    const gitDirWatcher = watchGitDir();

    webPanel.webview.html = createWevbviewHtml(ctx, webPanel.webview);

    webPanel.onDidDispose(() => {
      messageProtocolAttachment.dispose();
      rpcListener.dispose();
      rpcNotifier.dispose();
      gitDirWatcher.dispose();
      currentPanel = undefined;
    });
    currentPanel = webPanel;
  };
}
