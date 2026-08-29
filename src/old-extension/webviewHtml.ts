import * as vscode from "vscode";

import { getNonce } from "@/backend/utils/nonce";
import { buildExtensionUri } from "@/backend/utils/path";
import type { Config } from "@/old-extension/config";
import { ExtensionState } from "@/old-extension/extensionState";
import type { GitGraphViewState } from "@/types";

import { EXTENSION_NAME } from "./constant/const";
import { getWebviewLocalizedStrings } from "./l10n/webviewL10n";
import type { RepoManager } from "./repoManager";

/**
 * Safely escape JSON for embedding in HTML script tags.
 * Prevents XSS by escaping characters that could break out of script context.
 */
function escapeJsonForHtml(obj: object): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function buildWebviewHtml(opts: {
  webview: vscode.Webview;
  config: Config;
  extensionPath: string;
  extensionState: ExtensionState;
  repoManager: RepoManager;
}): { html: string; isGraphLoaded: boolean } {
  const { webview, config, extensionPath, extensionState, repoManager } = opts;
  const nonce = getNonce();
  const l10nStrings = getWebviewLocalizedStrings();
  const viewState: GitGraphViewState = {
    autoCenterCommitDetailsView: config.autoCenterCommitDetailsView(),
    dateFormat: config.dateFormat(),
    fetchAvatars: config.fetchAvatars() && extensionState.isAvatarStorageAvailable(),
    graphColours: config.graphColours(),
    graphStyle: config.graphStyle(),
    initialLoadCommits: config.initialLoadCommits(),
    lastActiveRepo: extensionState.getLastActiveRepo(),
    loadMoreCommits: config.loadMoreCommits(),
    locale: vscode.env.language,
    repos: repoManager.getRepos(),
    showCurrentBranchByDefault: config.showCurrentBranchByDefault()
  };

  const numRepos = Object.keys(viewState.repos).length;

  const compiledOutputUri = (file: string) =>
    webview.asWebviewUri(buildExtensionUri(extensionPath, "out", file));

  // The extension host only bootstraps the webview: it sets up the CSP, injects
  // the initial state (viewState / l10n) and mounts the Preact bundle. Everything
  // the user sees — controls, graph, dialogs, "unable to load" state — is rendered
  // by Preact into #app.
  const html = `<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}'; img-src data:;">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link rel="stylesheet" href="${compiledOutputUri("web.min.css")}">
			<title>${EXTENSION_NAME}</title>
		</head>
		<body>
			<div id="app"></div>
			<script nonce="${nonce}">var viewState = ${escapeJsonForHtml(viewState)};</script>
			<script nonce="${nonce}">var l10n = ${escapeJsonForHtml(l10nStrings)};</script>
			<script nonce="${nonce}" src="${compiledOutputUri("web.min.js")}"></script>
		</body>
	</html>`;

  return { html, isGraphLoaded: numRepos > 0 };
}
