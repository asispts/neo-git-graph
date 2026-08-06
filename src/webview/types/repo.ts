export type RepoData = {
  label: string;
  value: string;
};

export type RepoList = Array<RepoData>;

export type RepositoryState =
  | { status: "loading" }
  | { status: "no-repo" }
  | { status: "ready"; repos: RepoList; selectedRepo: RepoData };

export type ReadyRepositoryState = Extract<RepositoryState, { status: "ready" }>;
