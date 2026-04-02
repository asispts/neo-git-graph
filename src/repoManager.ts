import * as vscode from "vscode";

import { isGitRepository, isPathWithinRepos, sortRepos } from "./backend/utils/git.util";
import { getPathFromUri } from "./backend/utils/path.util";
import { evalPromises } from "./backend/utils/promise.util";
import { Config } from "./config";
import { ExtensionState } from "./extensionState";
import { StatusBarItem } from "./statusBarItem";
import { GitRepoSet, GitRepoState } from "./types";

export class RepoManager {
  private readonly extensionState: ExtensionState;
  private readonly statusBarItem: StatusBarItem;
  private readonly config: Config;
  private repos: GitRepoSet;
  private viewCallback: ((repos: GitRepoSet, numRepos: number) => void) | null = null;

  constructor(extensionState: ExtensionState, statusBarItem: StatusBarItem, config: Config) {
    this.extensionState = extensionState;
    this.statusBarItem = statusBarItem;
    this.config = config;
    this.repos = extensionState.getRepos();
  }

  public registerViewCallback(viewCallback: (repos: GitRepoSet, numRepos: number) => void) {
    this.viewCallback = viewCallback;
  }

  public deregisterViewCallback() {
    this.viewCallback = null;
  }

  public getRepos() {
    return sortRepos(this.repos);
  }

  public isDirectoryWithinRepos(path: string) {
    return isPathWithinRepos(path, this.repos);
  }

  public sendRepos() {
    const repos = this.getRepos();
    const numRepos = Object.keys(repos).length;
    this.statusBarItem.setNumRepos(numRepos);
    if (this.viewCallback !== null) this.viewCallback(repos, numRepos);
  }

  public addRepo(repo: string) {
    this.repos[repo] = { columnWidths: null };
    this.extensionState.saveRepos(this.repos);
  }

  public removeRepo(repo: string) {
    delete this.repos[repo];
    this.extensionState.saveRepos(this.repos);
  }

  public removeReposWithinFolder(path: string) {
    const pathFolder = path + "/";
    const repoPaths = Object.keys(this.repos);
    let changes = false;
    for (let i = 0; i < repoPaths.length; i++) {
      if (repoPaths[i] === path || repoPaths[i].startsWith(pathFolder)) {
        this.removeRepo(repoPaths[i]);
        changes = true;
      }
    }
    return changes;
  }

  public setRepoState(repo: string, state: GitRepoState) {
    this.repos[repo] = state;
    this.extensionState.saveRepos(this.repos);
  }

  public removeReposNotInWorkspace() {
    const rootsExact: string[] = [];
    const rootsFolder: string[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const repoPaths = Object.keys(this.repos);
    if (typeof workspaceFolders !== "undefined") {
      for (let i = 0; i < workspaceFolders.length; i++) {
        const path = getPathFromUri(workspaceFolders[i].uri);
        rootsExact.push(path);
        rootsFolder.push(path + "/");
      }
    }
    for (let i = 0; i < repoPaths.length; i++) {
      if (
        rootsExact.indexOf(repoPaths[i]) === -1 &&
        !rootsFolder.find((x) => repoPaths[i].startsWith(x))
      )
        this.removeRepo(repoPaths[i]);
    }
  }

  public checkReposExist() {
    return new Promise<boolean>((resolve) => {
      const repoPaths = Object.keys(this.repos);
      let changes = false;
      evalPromises(repoPaths, 3, (path) => isGitRepository(path, this.config.gitPath())).then(
        (results) => {
          for (let i = 0; i < repoPaths.length; i++) {
            if (!results[i]) {
              this.removeRepo(repoPaths[i]);
              changes = true;
            }
          }
          if (changes) this.sendRepos();
          resolve(changes);
        }
      );
    });
  }
}
