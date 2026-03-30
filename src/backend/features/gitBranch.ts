import type { GitInstance } from "./gitClient";

export type GitBranch = ReturnType<typeof gitBranchFactory>;

export function gitBranchFactory(gitClient: GitInstance) {
  return {
    list: async (showRemoteBranches: boolean) => {
      try {
        const summary = await (showRemoteBranches
          ? gitClient().branch()
          : gitClient().branchLocal());
        const head = summary.detached ? null : summary.current || null;
        const branches = head ? [head, ...summary.all.filter((b) => b !== head)] : [...summary.all];
        return { branches, head, error: false };
      } catch {
        return { branches: [], head: null, error: true };
      }
    },

    rename: async (oldName: string, newName: string) => {
      try {
        await gitClient().raw(["branch", "-m", oldName, newName]);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    create: async (branchName: string, commitHash: string) => {
      try {
        await gitClient().raw(["branch", branchName, commitHash]);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    delete: async (branchName: string, forceDelete: boolean) => {
      try {
        await gitClient().deleteLocalBranch(branchName, forceDelete);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    checkout: async (branchName: string, remoteBranch: string | null) => {
      try {
        if (remoteBranch === null) {
          await gitClient().checkout(branchName);
        } else {
          await gitClient().checkoutBranch(branchName, remoteBranch);
        }
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    }
  };
}
