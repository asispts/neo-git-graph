import * as fs from "node:fs";

import * as vscode from "vscode";

import { isGitRepository } from "@/backend/utils/git.util";
import { getPathFromUri, isDirectory } from "@/backend/utils/path.util";
import { evalPromises } from "@/backend/utils/promise.util";
import { Config } from "@/config";

import { RepoManager } from "./repoManager";

export function createRepoSearch(repoManager: RepoManager, config: Config) {
  let maxDepthOfRepoSearch = config.maxDepthOfRepoSearch();

  function searchDirectoryForRepos(directory: string, maxDepth: number): Promise<boolean> {
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
