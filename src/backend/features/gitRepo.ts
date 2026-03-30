import simpleGit from "simple-git";

export type GitRepo = ReturnType<typeof gitRepoFactory>;

export function gitRepoFactory(initialGitPath: string) {
  let gitPath = initialGitPath;

  return {
    setGitPath(newGitPath: string) {
      gitPath = newGitPath;
    },

    isGitRepository: async (repoPath: string): Promise<boolean> => {
      try {
        return await simpleGit({ baseDir: repoPath, binary: gitPath }).checkIsRepo();
      } catch {
        return false;
      }
    }
  };
}
