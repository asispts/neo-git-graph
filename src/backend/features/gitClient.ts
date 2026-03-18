import simpleGit from "simple-git";

import { gitBranchFactory } from "./gitBranch";

export type GitClient = ReturnType<typeof gitClientFactory>;
export type GitClientManager = ReturnType<typeof createGitClientManager>;

export function gitClientFactory(repoPath: string, gitPath: string) {
  const git = simpleGit({
    baseDir: repoPath,
    binary: gitPath,
    maxConcurrentProcesses: 6,
    trimmed: false
  });

  return {
    branch: gitBranchFactory(git)
  };
}

export function createGitClientManager(repoPath: string, gitPath: string) {
  let currentRepo = repoPath;
  let currentGitPath = gitPath;
  let client = gitClientFactory(currentRepo, currentGitPath);

  return {
    get(): GitClient {
      return client;
    },
    setRepo(newRepoPath: string) {
      currentRepo = newRepoPath;
      client = gitClientFactory(currentRepo, currentGitPath);
    },
    setGitPath(newGitPath: string) {
      currentGitPath = newGitPath;
      client = gitClientFactory(currentRepo, currentGitPath);
    }
  };
}
