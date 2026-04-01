import type { SimpleGit } from "simple-git";
import simpleGit from "simple-git";

export type GitClient = ReturnType<typeof gitClientFactory>;
export type GitInstance = GitClient["getInstance"];

export function gitClientFactory(repoPath: string, gitPath: string) {
  let git: SimpleGit = simpleGit({
    baseDir: repoPath,
    binary: gitPath,
    maxConcurrentProcesses: 6,
    trimmed: false
  });

  return {
    getInstance: (): SimpleGit => git,
    setRepo(newRepoPath: string) {
      repoPath = newRepoPath;
      git = simpleGit({
        baseDir: repoPath,
        binary: gitPath,
        maxConcurrentProcesses: 6,
        trimmed: false
      });
    },
    setGitPath(newGitPath: string) {
      gitPath = newGitPath;
      git = simpleGit({
        baseDir: repoPath,
        binary: gitPath,
        maxConcurrentProcesses: 6,
        trimmed: false
      });
    }
  };
}
