import type { GitInstance } from "./gitClient";

export type GitBranch = ReturnType<typeof gitBranchFactory>;

export function gitBranchFactory(gitClient: GitInstance) {
  return {
    list: async (showRemoteBranches: boolean) => {
      try {
        const git = gitClient();
        const summary = await (showRemoteBranches ? git.branch() : git.branchLocal());
        const head = summary.detached ? null : summary.current || null;
        const branches = head ? [head, ...summary.all.filter((b) => b !== head)] : [...summary.all];
        return { branches, head, error: false };
      } catch {
        return { branches: [], head: null, error: true };
      }
    }
  };
}
