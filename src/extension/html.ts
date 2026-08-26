import crypto from "node:crypto";

import * as vscode from "vscode";

import { EXTENSION_NAME } from "./constants";

export function createWevbviewHtml(ctx: vscode.ExtensionContext, webview: vscode.Webview) {
  const toOutputUri = (file: string) => {
    const uri = vscode.Uri.joinPath(ctx.extensionUri, "out", file);
    return webview.asWebviewUri(uri);
  };

  const nonce = crypto.randomBytes(32).toString("base64url");

  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';
      script-src ${webview.cspSource} 'nonce-${nonce}'; img-src data:; connect-src ${webview.cspSource};">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="${toOutputUri("web.min.css")}">
      <title>${EXTENSION_NAME}</title>
    </head>
    <body>
      <div id="app"></div>
      <script nonce="${nonce}" src="${toOutputUri("web.min.js")}"></script>
      </body>
  </html>`;

  return html;
}
