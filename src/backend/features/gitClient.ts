import simpleGit from "simple-git";

export type GitClient = ReturnType<typeof createGitClient>;

export function createGitClient(repoPath: string, gitPath: string) {
  const git = simpleGit({ baseDir: repoPath, binary: gitPath, maxConcurrentProcesses: 6, trimmed: false });

  return {
    getBranches: async (showRemoteBranches: boolean) => {
      try {
        const summary = await (showRemoteBranches ? git.branch() : git.branchLocal());
        const head = summary.detached ? null : summary.current || null;
        const branches = head
          ? [head, ...summary.all.filter((b) => b !== head)]
          : [...summary.all];
        return { branches, head, error: false };
      } catch {
        return { branches: [], head: null, error: true };
      }
    }
  };
}
