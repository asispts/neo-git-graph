import * as vscode from "vscode";

import { EXTENSION_NAME } from "./constants";
import { createWevbviewHtml } from "./html";
import { createMessageProtocol } from "./legacy";
import { createRpcServer } from "./rpc/rpc-server";

export function createViewCommand(ctx: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  const messageProtocol = createMessageProtocol(ctx);
  const rpcServer = createRpcServer();

  return async () => {
    await messageProtocol.ready;

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

    webPanel.webview.html = createWevbviewHtml(ctx, webPanel.webview);
    const messageProtocolAttachment = messageProtocol.attach(webPanel);
    const rpcListener = rpcServer.attach(webPanel.webview);

    webPanel.onDidDispose(() => {
      messageProtocolAttachment.dispose();
      rpcListener.dispose();
      currentPanel = undefined;
    });
    currentPanel = webPanel;
  };
}
