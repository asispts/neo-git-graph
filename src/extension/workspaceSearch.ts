import * as vscode from "vscode";

import { getPathFromUri } from "@/backend/utils/path.util";
import { searchDirectoryForRepos as searchDirectoryForReposUtil } from "@/backend/utils/repoSearch.util";
import { Config } from "@/config";

import { RepoManager } from "./repoManager";

export function createRepoSearch(repoManager: RepoManager, config: Config) {
  let maxDepthOfRepoSearch = config.maxDepthOfRepoSearch();

  async function searchDirectoryForRepos(directory: string, maxDepth: number): Promise<boolean> {
    const found = await searchDirectoryForReposUtil(
      directory,
      maxDepth,
      config.gitPath(),
      Object.keys(repoManager.getRepos())
    );
    for (const repo of found) {
      repoManager.addRepo(repo);
    }
    return found.length > 0;
  }

  async function searchWorkspaceForRepos() {
    const rootFolders = vscode.workspace.workspaceFolders;
    let changes = false;
    if (typeof rootFolders !== "undefined") {
      for (let i = 0; i < rootFolders.length; i++) {
        const path = getPathFromUri(rootFolders[i].uri);
        if (await searchDirectoryForRepos(path, maxDepthOfRepoSearch)) changes = true;
      }
    }
    if (changes) repoManager.sendRepos();
  }

  return {
    searchDirectoryForRepos,
    searchWorkspaceForRepos,
    maxDepthChanged() {
      const newDepth = config.maxDepthOfRepoSearch();
      if (newDepth > maxDepthOfRepoSearch) {
        maxDepthOfRepoSearch = newDepth;
        searchWorkspaceForRepos();
      } else {
        maxDepthOfRepoSearch = newDepth;
      }
    }
  };
}

export type RepoSearch = ReturnType<typeof createRepoSearch>;
