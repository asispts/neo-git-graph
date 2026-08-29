import { isGitRepository } from "@/backend/utils/git";
import { evalPromises } from "@/backend/utils/promise";
import type { Config } from "@/old-extension/config";
import { ExtensionState } from "@/old-extension/extensionState";
import type { GitRepoSet, GitRepoState } from "@/types";

function sortRepos(repos: GitRepoSet) {
  const repoPaths = Object.keys(repos).toSorted();
  const sorted: GitRepoSet = {};
  for (const repoPath of repoPaths) {
    const repo = repos[repoPath];
    if (repo !== undefined) {
      sorted[repoPath] = repo;
    }
  }
  return sorted;
}

export function createRepoManager(extensionState: ExtensionState, config: Config) {
  let repos = extensionState.getRepos();
  let viewCallback: ((repos: GitRepoSet) => void) | null = null;

  function setRepos(repoDirs: string[]) {
    const next: GitRepoSet = {};
    for (const repo of repoDirs) {
      next[repo] = repos[repo] ?? { columnWidths: null };
    }
    repos = next;
    extensionState.saveRepos(repos);
  }

  function getRepos() {
    return sortRepos(repos);
  }

  function sendRepos() {
    const sorted = getRepos();
    if (viewCallback !== null) {
      viewCallback(sorted);
    }
  }

  function removeRepo(repo: string) {
    delete repos[repo];
    extensionState.saveRepos(repos);
  }

  function registerViewCallback(cb: (repos: GitRepoSet) => void) {
    viewCallback = cb;
  }

  function deregisterViewCallback() {
    viewCallback = null;
  }

  function isDirectoryWithinRepos(path: string) {
    const repoPaths = Object.keys(repos);
    for (let i = 0; i < repoPaths.length; i++) {
      if (path === repoPaths[i] || path.startsWith(repoPaths[i] + "/")) {
        return true;
      }
    }
    return false;
  }

  function addRepo(repo: string) {
    if (repos[repo]) {
      return false;
    }
    repos[repo] = { columnWidths: null };
    extensionState.saveRepos(repos);
    return true;
  }

  function removeReposWithinFolder(path: string) {
    const pathFolder = path + "/";
    const repoPaths = Object.keys(repos);
    let changes = false;
    for (let i = 0; i < repoPaths.length; i++) {
      if (repoPaths[i] === path || repoPaths[i].startsWith(pathFolder)) {
        removeRepo(repoPaths[i]);
        changes = true;
      }
    }
    return changes;
  }

  function setRepoState(repo: string, state: GitRepoState) {
    repos[repo] = state;
    extensionState.saveRepos(repos);
  }

  function checkReposExist() {
    return new Promise<boolean>((resolve) => {
      const repoPaths = Object.keys(repos);
      let changes = false;
      evalPromises(repoPaths, 3, (path) => isGitRepository(path, config.gitPath())).then(
        (results) => {
          for (let i = 0; i < repoPaths.length; i++) {
            if (!results[i]) {
              removeRepo(repoPaths[i]);
              changes = true;
            }
          }
          if (changes) {
            sendRepos();
          }
          resolve(changes);
        }
      );
    });
  }

  return {
    registerViewCallback,
    deregisterViewCallback,
    isDirectoryWithinRepos,
    getRepos,
    sendRepos,
    setRepos,
    addRepo,
    removeRepo,
    removeReposWithinFolder,
    setRepoState,
    checkReposExist
  };
}

export type RepoManager = ReturnType<typeof createRepoManager>;
