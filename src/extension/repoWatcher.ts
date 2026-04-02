import * as fs from "node:fs";

import * as vscode from "vscode";

import { isGitRepository } from "@/backend/utils/git.util";
import { doesPathExist, getPathFromUri, isDirectory } from "@/backend/utils/path.util";
import { evalPromises } from "@/backend/utils/promise.util";
import { Config } from "@/config";
import { RepoManager } from "@/repoManager";

export function createRepoWatcher(repoManager: RepoManager, config: Config) {
  let maxDepthOfRepoSearch = config.maxDepthOfRepoSearch();
  const folderWatchers: { [workspace: string]: vscode.FileSystemWatcher } = {};
  const createEventPaths: string[] = [];
  const changeEventPaths: string[] = [];
  let processCreateEventsTimeout: NodeJS.Timeout | null = null;
  let processChangeEventsTimeout: NodeJS.Timeout | null = null;

  function searchDirectoryForRepos(directory: string, maxDepth: number): Promise<boolean> {
    // Returns a promise resolving to a boolean, that indicates if new repositories were found.
    return new Promise<boolean>((resolve) => {
      if (repoManager.isDirectoryWithinRepos(directory)) {
        resolve(false);
        return;
      }

      isGitRepository(directory, config.gitPath())
        .then((isRepo) => {
          if (isRepo) {
            repoManager.addRepo(directory);
            resolve(true);
          } else if (maxDepth > 0) {
            fs.readdir(directory, async (err, dirContents) => {
              if (err) {
                resolve(false);
              } else {
                const dirs: string[] = [];
                for (let i = 0; i < dirContents.length; i++) {
                  if (
                    dirContents[i] !== ".git" &&
                    (await isDirectory(directory + "/" + dirContents[i]))
                  ) {
                    dirs.push(directory + "/" + dirContents[i]);
                  }
                }
                resolve(
                  (
                    await evalPromises(dirs, 2, (dir) => searchDirectoryForRepos(dir, maxDepth - 1))
                  ).indexOf(true) > -1
                );
              }
            });
          } else {
            resolve(false);
          }
        })
        .catch(() => resolve(false));
    });
  }

  async function searchWorkspaceForRepos() {
    const rootFolders = vscode.workspace.workspaceFolders;
    let changes = false;
    if (typeof rootFolders !== "undefined") {
      for (let i = 0; i < rootFolders.length; i++) {
        if (await searchDirectoryForRepos(getPathFromUri(rootFolders[i].uri), maxDepthOfRepoSearch))
          changes = true;
      }
    }
    if (changes) repoManager.sendRepos();
  }

  async function processCreateEvents() {
    let path;
    let changes = false;
    while ((path = createEventPaths.shift())) {
      if (await isDirectory(path)) {
        if (await searchDirectoryForRepos(path, maxDepthOfRepoSearch)) changes = true;
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
    processCreateEventsTimeout = setTimeout(() => processCreateEvents(), 1000);
  }

  function onWatcherChange(uri: vscode.Uri) {
    let path = getPathFromUri(uri);
    if (path.indexOf("/.git/") > -1) return;
    if (path.endsWith("/.git")) path = path.slice(0, -5);
    if (changeEventPaths.indexOf(path) > -1) return;

    changeEventPaths.push(path);
    if (processChangeEventsTimeout !== null) clearTimeout(processChangeEventsTimeout);
    processChangeEventsTimeout = setTimeout(() => processChangeEvents(), 1000);
  }

  function onWatcherDelete(uri: vscode.Uri) {
    let path = getPathFromUri(uri);
    if (path.indexOf("/.git/") > -1) return;
    if (path.endsWith("/.git")) path = path.slice(0, -5);
    if (repoManager.removeReposWithinFolder(path)) repoManager.sendRepos();
  }

  function startWatchingFolder(path: string) {
    const watcher = vscode.workspace.createFileSystemWatcher(path + "/**");
    watcher.onDidCreate((uri) => onWatcherCreate(uri));
    watcher.onDidChange((uri) => onWatcherChange(uri));
    watcher.onDidDelete((uri) => onWatcherDelete(uri));
    folderWatchers[path] = watcher;
  }

  function stopWatchingFolder(path: string) {
    folderWatchers[path].dispose();
    delete folderWatchers[path];
  }

  const folderChangeHandler = vscode.workspace.onDidChangeWorkspaceFolders(async (e) => {
    if (e.added.length > 0) {
      let path: string;
      let changes = false;
      for (let i = 0; i < e.added.length; i++) {
        path = getPathFromUri(e.added[i].uri);
        if (await searchDirectoryForRepos(path, maxDepthOfRepoSearch)) changes = true;
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
    searchWorkspaceForRepos,
    startWatching() {
      const rootFolders = vscode.workspace.workspaceFolders;
      if (typeof rootFolders !== "undefined") {
        for (let i = 0; i < rootFolders.length; i++) {
          startWatchingFolder(getPathFromUri(rootFolders[i].uri));
        }
      }
    },
    maxDepthChanged() {
      const newDepth = config.maxDepthOfRepoSearch();
      if (newDepth > maxDepthOfRepoSearch) {
        maxDepthOfRepoSearch = newDepth;
        searchWorkspaceForRepos();
      } else {
        maxDepthOfRepoSearch = newDepth;
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
