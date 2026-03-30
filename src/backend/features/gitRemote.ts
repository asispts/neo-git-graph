import simpleGit from "simple-git";

export type GitRemote = ReturnType<typeof gitRemoteFactory>;

export function gitRemoteFactory(initialGitPath: string) {
  let gitPath = initialGitPath;

  return {
    setGitPath(newGitPath: string) {
      gitPath = newGitPath;
    },

    getRemoteUrl: async (repoPath: string): Promise<string | null> => {
      try {
        const url = await simpleGit({ baseDir: repoPath, binary: gitPath }).raw([
          "config",
          "--get",
          "remote.origin.url"
        ]);
        return url.trim() || null;
      } catch {
        return null;
      }
    }
  };
}
