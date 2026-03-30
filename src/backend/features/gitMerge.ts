import type { GitInstance } from "./gitClient";

export type GitMerge = ReturnType<typeof gitMergeFactory>;

export function gitMergeFactory(gitClient: GitInstance) {
  return {
    mergeBranch: async (branchName: string, createNewCommit: boolean) => {
      try {
        const args = createNewCommit ? [branchName, "--no-ff"] : [branchName];
        await gitClient().merge(args);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    mergeCommit: async (commitHash: string, createNewCommit: boolean) => {
      try {
        const args = createNewCommit ? [commitHash, "--no-ff"] : [commitHash];
        await gitClient().merge(args);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    }
  };
}
