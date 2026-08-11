import type { GitCommitDetails, GitCommitNode } from "./git.types";

type QueryPayloads = {
  commitDetails: {
    request: { repo: string; commitHash: string };
    response: { commitDetails: GitCommitDetails | null };
  };
  loadBranches: {
    request: { repo: string; showRemoteBranches: boolean; hard: boolean };
    response: {
      repo: string;
      branches: string[];
      head: string | null;
      hard: boolean;
      isRepo: boolean;
    };
  };
  loadCommits: {
    request: {
      repo: string;
      branchName: string;
      maxCommits: number;
      showRemoteBranches: boolean;
      hard: boolean;
    };
    response: {
      repo: string;
      branchName: string;
      commits: GitCommitNode[];
      head: string | null;
      moreCommitsAvailable: boolean;
      hard: boolean;
    };
  };
};

export type QueryRequest = {
  [K in keyof QueryPayloads]: { command: K } & QueryPayloads[K]["request"];
}[keyof QueryPayloads];

export type QueryResponse = {
  [K in keyof QueryPayloads]: { command: K } & QueryPayloads[K]["response"];
}[keyof QueryPayloads];

export type QueryResult<T extends keyof QueryPayloads> = QueryPayloads[T]["response"];
