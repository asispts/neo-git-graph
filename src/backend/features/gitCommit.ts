import type { DateType, GitCommitDetails } from "../../types";
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
      getCommitDetails(gitClient, commitHash, dateType)
  };
}
