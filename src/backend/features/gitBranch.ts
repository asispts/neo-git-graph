import type { SimpleGit } from "simple-git";

export function gitBranchFactory(git: SimpleGit) {
  return {
    list: async (showRemoteBranches: boolean) => {
      try {
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
