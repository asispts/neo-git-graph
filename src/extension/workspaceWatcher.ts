import * as vscode from "vscode";

import { doesPathExist, getPathFromUri, isDirectory } from "@/backend/utils/path.util";
import { Config } from "@/config";

import { RepoManager } from "./repoManager";
import { RepoSearch } from "./workspaceSearch";

type WorkspaceApi = Pick<
  typeof vscode.workspace,
  "createFileSystemWatcher" | "onDidChangeWorkspaceFolders" | "workspaceFolders"
>;

export function createRepoWatcher(
  repoManager: RepoManager,
  config: Config,
  repoSearch: RepoSearch,
  workspace: WorkspaceApi = vscode.workspace,
  debounceDelay = 1000
) {
  const folderWatchers: { [workspace: string]: vscode.FileSystemWatcher } = {};
  const createEventPaths: string[] = [];
  const changeEventPaths: string[] = [];
  let processCreateEventsTimeout: NodeJS.Timeout | null = null;
  let processChangeEventsTimeout: NodeJS.Timeout | null = null;

  async function processCreateEvents() {
    let path;
    let changes = false;
    while ((path = createEventPaths.shift())) {
      if (await isDirectory(path)) {
        if (await repoSearch.searchDirectoryForRepos(path, config.maxDepthOfRepoSearch()))
          changes = true;
      }
    }
    processCreateEventsTimeout = null;
    if (changes) repoManager.sendRepos();
  }

  async function processChangeEvents() {
    let path;
    let changes = false;
    while ((path = changeEventPaths.shift())) {
      if (!(await doesPathExist(path))) {
        if (repoManager.removeReposWithinFolder(path)) changes = true;
      }
    }
    processChangeEventsTimeout = null;
    if (changes) repoManager.sendRepos();
  }

  async function onWatcherCreate(uri: vscode.Uri) {
    let path = getPathFromUri(uri);
    if (path.indexOf("/.git/") > -1) return;
    if (path.endsWith("/.git")) path = path.slice(0, -5);
    if (createEventPaths.indexOf(path) > -1) return;

    createEventPaths.push(path);
    if (processCreateEventsTimeout !== null) clearTimeout(processCreateEventsTimeout);
    processCreateEventsTimeout = setTimeout(() => processCreateEvents(), debounceDelay);
  }

  function onWatcherChange(uri: vscode.Uri) {
    let path = getPathFromUri(uri);
    if (path.indexOf("/.git/") > -1) return;
    if (path.endsWith("/.git")) path = path.slice(0, -5);
    if (changeEventPaths.indexOf(path) > -1) return;

    changeEventPaths.push(path);
    if (processChangeEventsTimeout !== null) clearTimeout(processChangeEventsTimeout);
    processChangeEventsTimeout = setTimeout(() => processChangeEvents(), debounceDelay);
  }

  function onWatcherDelete(uri: vscode.Uri) {
    let path = getPathFromUri(uri);
    if (path.indexOf("/.git/") > -1) return;
    if (path.endsWith("/.git")) path = path.slice(0, -5);
    if (repoManager.removeReposWithinFolder(path)) repoManager.sendRepos();
  }

  function startWatchingFolder(path: string) {
    const watcher = workspace.createFileSystemWatcher(path + "/**");
    watcher.onDidCreate((uri) => onWatcherCreate(uri));
    watcher.onDidChange((uri) => onWatcherChange(uri));
    watcher.onDidDelete((uri) => onWatcherDelete(uri));
    folderWatchers[path] = watcher;
  }

  function stopWatchingFolder(path: string) {
    folderWatchers[path].dispose();
    delete folderWatchers[path];
  }

  const folderChangeHandler = workspace.onDidChangeWorkspaceFolders(async (e) => {
    if (e.added.length > 0) {
      let path: string;
      let changes = false;
      for (let i = 0; i < e.added.length; i++) {
        path = getPathFromUri(e.added[i].uri);
        if (await repoSearch.searchDirectoryForRepos(path, config.maxDepthOfRepoSearch()))
          changes = true;
        startWatchingFolder(path);
      }
      if (changes) repoManager.sendRepos();
    }
    if (e.removed.length > 0) {
      let changes = false;
      let path: string;
      for (let i = 0; i < e.removed.length; i++) {
        path = getPathFromUri(e.removed[i].uri);
        if (repoManager.removeReposWithinFolder(path)) changes = true;
        stopWatchingFolder(path);
      }
      if (changes) repoManager.sendRepos();
    }
  });

  return {
    startWatching() {
      const rootFolders = workspace.workspaceFolders;
      if (typeof rootFolders !== "undefined") {
        for (let i = 0; i < rootFolders.length; i++) {
          startWatchingFolder(getPathFromUri(rootFolders[i].uri));
        }
      }
    },
    dispose() {
      folderChangeHandler.dispose();
      const folders = Object.keys(folderWatchers);
      for (const folder of folders) {
        stopWatchingFolder(folder);
      }
    }
  };
}

export type RepoWatcher = ReturnType<typeof createRepoWatcher>;
