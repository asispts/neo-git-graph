import simpleGit from "simple-git";

import { gitBranchFactory } from "./gitBranch";

export type GitClient = ReturnType<typeof gitClientFactory>;

export function gitClientFactory(repoPath: string, gitPath: string) {
  const git = simpleGit({ baseDir: repoPath, binary: gitPath, maxConcurrentProcesses: 6, trimmed: false });

  return {
    branch: gitBranchFactory(git),
  };
}
