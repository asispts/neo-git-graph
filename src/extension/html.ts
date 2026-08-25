import crypto from "node:crypto";

import * as vscode from "vscode";

import { getWebviewLocalizedStrings } from "@/old-extension/l10n/webviewL10n";
import { GitGraphViewState } from "@/types";

import { EXTENSION_NAME } from "./constants";

export function createWevbviewHtml(ctx: vscode.ExtensionContext, webview: vscode.Webview) {
  const toOutputUri = (file: string) => {
    const uri = vscode.Uri.joinPath(ctx.extensionUri, "out", file);
    return webview.asWebviewUri(uri);
  };

  const nonce = crypto.randomBytes(32).toString("base64url");
  const l10nStrings = getWebviewLocalizedStrings();

  const viewState: GitGraphViewState = {
    autoCenterCommitDetailsView: true,
    dateFormat: "Date & Time",
    fetchAvatars: false,
    graphColours: ["#0085d9", "#d9008f", "#00d90a", "#d98500", "#a300d9", "#ff0000"],
    graphStyle: "rounded",
    initialLoadCommits: 300,
    lastActiveRepo: null,
    loadMoreCommits: 75,
    locale: vscode.env.language,
    repos: {},
    showCurrentBranchByDefault: false
  };

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
			<script nonce="${nonce}">var viewState = ${escapeJsonForHtml(viewState)};</script>
			<script nonce="${nonce}">var l10n = ${escapeJsonForHtml(l10nStrings)};</script>
      <script nonce="${nonce}" src="${toOutputUri("web.min.js")}"></script>
      </body>
  </html>`;

  return html;
}

function escapeJsonForHtml(obj: object): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
