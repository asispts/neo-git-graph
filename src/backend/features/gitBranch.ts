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
    },

    rename: async (oldName: string, newName: string) => {
      try {
        const git = gitClient();
        await git.raw(["branch", "-m", oldName, newName]);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    create: async (branchName: string, commitHash: string) => {
      try {
        const git = gitClient();
        await git.raw(["branch", branchName, commitHash]);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    delete: async (branchName: string, forceDelete: boolean) => {
      try {
        const git = gitClient();
        await git.deleteLocalBranch(branchName, forceDelete);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    }
  };
}
