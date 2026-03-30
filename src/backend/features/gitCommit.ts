import type { DateType, GitCommitDetails, GitResetMode } from "../types";
import type { GitInstance } from "./gitClient";
import { getCommitDetails } from "./gitCommitDetails";
import { listCommits } from "./gitCommitList";

export type GitCommit = ReturnType<typeof gitCommitFactory>;

export function gitCommitFactory(gitClient: GitInstance) {
  return {
    list: (
      branch: string,
      maxCommits: number,
      showRemoteBranches: boolean,
      dateType: DateType,
      showUncommittedChanges: boolean
    ) =>
      listCommits(
        gitClient,
        branch,
        maxCommits,
        showRemoteBranches,
        dateType,
        showUncommittedChanges
      ),

    details: (commitHash: string, dateType: DateType): Promise<GitCommitDetails | null> =>
      getCommitDetails(gitClient, commitHash, dateType),

    checkout: async (commitHash: string) => {
      try {
        await gitClient().checkout(commitHash);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    reset: async (commitHash: string, resetMode: GitResetMode) => {
      try {
        await gitClient().raw(["reset", "--" + resetMode, commitHash]);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    cherrypick: async (commitHash: string, parentIndex: number) => {
      try {
        const args = ["cherry-pick"];
        if (parentIndex > 0) args.push("-m", String(parentIndex));
        args.push(commitHash);
        await gitClient().raw(args);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    revert: async (commitHash: string, parentIndex: number) => {
      try {
        const args = ["revert", "--no-edit"];
        if (parentIndex > 0) args.push("-m", String(parentIndex));
        args.push(commitHash);
        await gitClient().raw(args);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    }
  };
}
