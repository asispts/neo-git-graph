export type GitRepo = {
  name: string;
  path: string;
};

export type RepoChange = { type: "created"; repo: GitRepo } | { type: "deleted"; path: string };

export type RepoUpdate = {
  path: string;
};
