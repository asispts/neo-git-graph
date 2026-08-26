import type { WebviewConfig } from "./config";
import type { GitRepoSet } from "./legacy";

/** @deprecated Use `WebviewConfig`; repository data is sent through `loadRepos`. */
export type GitGraphViewState = WebviewConfig & {
  lastActiveRepo: string | null;
  repos: GitRepoSet;
};
