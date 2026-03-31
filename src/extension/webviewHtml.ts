import * as vscode from "vscode";

import { buildExtensionUri, getNonce } from "@/backend/utils";
import { getConfig } from "@/config";
import { ExtensionState } from "@/extensionState";
import { RepoManager } from "@/repoManager";
import { GitGraphViewState } from "@/types";

export function buildWebviewHtml(opts: {
  webview: vscode.Webview;
  extensionPath: string;
  extensionState: ExtensionState;
  repoManager: RepoManager;
}): { html: string; isGraphLoaded: boolean } {
  const { webview, extensionPath, extensionState, repoManager } = opts;
  const config = getConfig(),
    nonce = getNonce();
  const viewState: GitGraphViewState = {
    autoCenterCommitDetailsView: config.autoCenterCommitDetailsView(),
    dateFormat: config.dateFormat(),
    fetchAvatars: config.fetchAvatars() && extensionState.isAvatarStorageAvailable(),
    graphColours: config.graphColours(),
    graphStyle: config.graphStyle(),
    initialLoadCommits: config.initialLoadCommits(),
    lastActiveRepo: extensionState.getLastActiveRepo(),
    loadMoreCommits: config.loadMoreCommits(),
    repos: repoManager.getRepos(),
    showCurrentBranchByDefault: config.showCurrentBranchByDefault()
  };

  const numRepos = Object.keys(viewState.repos).length;
  let colorVars = "",
    colorParams = "";
  for (let i = 0; i < viewState.graphColours.length; i++) {
    colorVars += "--git-graph-color" + i + ":" + viewState.graphColours[i] + "; ";
    colorParams += '[data-color="' + i + '"]{--git-graph-color:var(--git-graph-color' + i + ");} ";
  }

  const mediaUri = (file: string) =>
    webview.asWebviewUri(buildExtensionUri(extensionPath, "media", file));
  const compiledOutputUri = (file: string) =>
    webview.asWebviewUri(buildExtensionUri(extensionPath, "out", file));

  let body: string;
  if (numRepos > 0) {
    body = `<body style="${colorVars}">
		<div id="controls">
			<span id="repoControl"><span class="unselectable">Repo: </span><div id="repoSelect" class="dropdown"></div></span>
			<span id="branchControl"><span class="unselectable">Branch: </span><div id="branchSelect" class="dropdown"></div></span>
			<label id="showRemoteBranchesControl"><input type="checkbox" id="showRemoteBranchesCheckbox" value="1" checked>Show Remote Branches</label>
      <div id="refreshBtn" class="roundedBtn">Refresh</div>
      <div id="blinkHeadBtn" class="roundedBtn">Locate HEAD</div>
		</div>
		<div id="content">
			<div id="commitGraph"></div>
			<div id="commitTable"></div>
		</div>
		<div id="footer"></div>
		<ul id="contextMenu"></ul>
		<div id="dialogBacking"></div>
		<div id="dialog"></div>
		<div id="scrollShadow"></div>
		<script nonce="${nonce}">var viewState = ${JSON.stringify(viewState)};</script>
		<script src="${compiledOutputUri("web.min.js")}"></script>
		</body>`;
  } else {
    body = `<body class="unableToLoad" style="${colorVars}">
		<h2>Unable to load Git Graph</h2>
		<p>Either the current workspace does not contain a Git repository, or the Git executable could not be found.</p>
		<p>If you are using a portable Git installation, make sure you have set the Visual Studio Code Setting "git.path" to the path of your portable installation (e.g. "C:\\Program Files\\Git\\bin\\git.exe" on Windows).</p>
		</body>`;
  }

  const html = `<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}'; img-src data:;">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link rel="stylesheet" type="text/css" href="${mediaUri("main.css")}">
			<link rel="stylesheet" type="text/css" href="${mediaUri("dropdown.css")}">
			<title>(neo) Git Graph</title>
			<style>${colorParams}"</style>
		</head>
		${body}
	</html>`;

  return { html, isGraphLoaded: numRepos > 0 };
}
