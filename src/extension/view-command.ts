import * as vscode from "vscode";

import { logger } from "@/old-extension/utils/logger";
import { RequestMessage } from "@/types";

import { EXTENSION_NAME } from "./constants";
import { createWevbviewHtml } from "./html";

export function createViewCommand(ctx: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  return () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.window.activeTextEditor?.viewColumn);
      return;
    }

    const vsPanel = vscode.window.createWebviewPanel(
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

    vsPanel.webview.html = createWevbviewHtml(ctx, vsPanel.webview);

    const messageListener = vsPanel.webview.onDidReceiveMessage(async (msg: RequestMessage) => {
      logger.log(msg.command);
    });

    vsPanel.onDidDispose(() => {
      messageListener.dispose();
      currentPanel = undefined;
    });
    currentPanel = vsPanel;
  };
}
