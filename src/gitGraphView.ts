import * as vscode from "vscode";

import { AvatarManager } from "./avatarManager";
import { GitClientManager } from "./backend/features/gitClient";
import { buildExtensionUri, getNonce } from "./backend/utils";
import { getConfig } from "./config";
import { DataSource } from "./dataSource";
import { createMessageHandler } from "./extension/messageHandler";
import { WebviewBridge } from "./extension/webviewBridge";
import { ExtensionState } from "./extensionState";
import { RepoFileWatcher } from "./repoFileWatcher";
import { RepoManager } from "./repoManager";
import { GitGraphViewState, GitRepoSet } from "./types";

export class GitGraphView {
  public static currentPanel: GitGraphView | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly bridge: WebviewBridge;
  private readonly extensionPath: string;
  private readonly avatarManager: AvatarManager;
  private readonly dataSource: DataSource;
  private readonly extensionState: ExtensionState;
  private readonly repoFileWatcher: RepoFileWatcher;
  private readonly repoManager: RepoManager;
  private disposables: vscode.Disposable[] = [];
  private isGraphViewLoaded: boolean = false;
  private isPanelVisible: boolean = true;
  private currentRepo: string | null = null;
  private readonly gitManager: GitClientManager;

  public reveal(column?: vscode.ViewColumn) {
    this.panel.reveal(column);
  }

  public constructor(
    panel: vscode.WebviewPanel,
    bridge: WebviewBridge,
    extensionPath: string,
    dataSource: DataSource,
    extensionState: ExtensionState,
    avatarManager: AvatarManager,
    repoManager: RepoManager,
    gitManager: GitClientManager
  ) {
    this.panel = panel;
    this.bridge = bridge;
    this.extensionPath = extensionPath;
    this.avatarManager = avatarManager;
    this.dataSource = dataSource;
    this.extensionState = extensionState;
    this.repoManager = repoManager;
    this.gitManager = gitManager;
    GitGraphView.currentPanel = this;

    panel.iconPath =
      getConfig().tabIconColourTheme() === "colour"
        ? buildExtensionUri(this.extensionPath, "resources", "webview-icon.svg")
        : {
            light: buildExtensionUri(this.extensionPath, "resources", "webview-icon-light.svg"),
            dark: buildExtensionUri(this.extensionPath, "resources", "webview-icon-dark.svg")
          };

    this.update();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.visible !== this.isPanelVisible) {
          if (this.panel.visible) {
            this.update();
          } else {
            this.currentRepo = null;
            this.repoFileWatcher.stop();
          }
          this.isPanelVisible = this.panel.visible;
        }
      },
      null,
      this.disposables
    );

    this.repoFileWatcher = new RepoFileWatcher(() => {
      if (this.panel.visible) {
        this.bridge.post({ command: "refresh" });
      }
    });
    this.repoManager.registerViewCallback((repos: GitRepoSet, numRepos: number) => {
      if (!this.panel.visible) return;
      if ((numRepos === 0 && this.isGraphViewLoaded) || (numRepos > 0 && !this.isGraphViewLoaded)) {
        this.update();
      } else {
        this.bridge.post({
          command: "loadRepos",
          repos,
          lastActiveRepo: this.extensionState.getLastActiveRepo()
        });
      }
    });

    this.bridge.onMessage(
      createMessageHandler({
        dataSource: this.dataSource,
        gitManager: this.gitManager,
        repoManager: this.repoManager,
        extensionState: this.extensionState,
        avatarManager: this.avatarManager,
        repoFileWatcher: this.repoFileWatcher,
        bridge: this.bridge,
        getCurrentRepo: () => this.currentRepo,
        setCurrentRepo: (r) => {
          this.currentRepo = r;
        }
      }),
      this.disposables
    );
  }

  public dispose() {
    GitGraphView.currentPanel = undefined;
    this.panel.dispose();
    this.avatarManager.deregisterBridge();
    this.repoFileWatcher.stop();
    this.repoManager.deregisterViewCallback();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) x.dispose();
    }
  }

  private async update() {
    this.panel.webview.html = await this.getHtmlForWebview();
  }

  private getHtmlForWebview() {
    const config = getConfig(),
      nonce = getNonce();
    const viewState: GitGraphViewState = {
      autoCenterCommitDetailsView: config.autoCenterCommitDetailsView(),
      dateFormat: config.dateFormat(),
      fetchAvatars: config.fetchAvatars() && this.extensionState.isAvatarStorageAvailable(),
      graphColours: config.graphColours(),
      graphStyle: config.graphStyle(),
      initialLoadCommits: config.initialLoadCommits(),
      lastActiveRepo: this.extensionState.getLastActiveRepo(),
      loadMoreCommits: config.loadMoreCommits(),
      repos: this.repoManager.getRepos(),
      showCurrentBranchByDefault: config.showCurrentBranchByDefault()
    };

    let body,
      numRepos = Object.keys(viewState.repos).length,
      colorVars = "",
      colorParams = "";
    for (let i = 0; i < viewState.graphColours.length; i++) {
      colorVars += "--git-graph-color" + i + ":" + viewState.graphColours[i] + "; ";
      colorParams +=
        '[data-color="' + i + '"]{--git-graph-color:var(--git-graph-color' + i + ");} ";
    }
    if (numRepos > 0) {
      body = `<body style="${colorVars}">
			<div id="controls">
				<span id="repoControl"><span class="unselectable">Repo: </span><div id="repoSelect" class="dropdown"></div></span>
				<span id="branchControl"><span class="unselectable">Branch: </span><div id="branchSelect" class="dropdown"></div></span>
				<label id="showRemoteBranchesControl"><input type="checkbox" id="showRemoteBranchesCheckbox" value="1" checked>Show Remote Branches</label>
				<div id="refreshBtn" class="roundedBtn">Refresh</div>
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
			<script src="${this.getCompiledOutputUri("web.min.js")}"></script>
			</body>`;
    } else {
      body = `<body class="unableToLoad" style="${colorVars}">
			<h2>Unable to load Git Graph</h2>
			<p>Either the current workspace does not contain a Git repository, or the Git executable could not be found.</p>
			<p>If you are using a portable Git installation, make sure you have set the Visual Studio Code Setting "git.path" to the path of your portable installation (e.g. "C:\\Program Files\\Git\\bin\\git.exe" on Windows).</p>
			</body>`;
    }
    this.isGraphViewLoaded = numRepos > 0;

    return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src ${this.panel.webview.cspSource} 'nonce-${nonce}'; img-src data:;">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link rel="stylesheet" type="text/css" href="${this.getMediaUri("main.css")}">
				<link rel="stylesheet" type="text/css" href="${this.getMediaUri("dropdown.css")}">
				<title>(neo) Git Graph</title>
				<style>${colorParams}"</style>
			</head>
			${body}
		</html>`;
  }

  private getMediaUri(file: string) {
    return this.panel.webview.asWebviewUri(buildExtensionUri(this.extensionPath, "media", file));
  }

  private getCompiledOutputUri(file: string) {
    return this.panel.webview.asWebviewUri(buildExtensionUri(this.extensionPath, "out", file));
  }

}
