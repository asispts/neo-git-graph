import { GitRepoSet } from "@/types";

export function isPathWithinRepos(path: string, repos: GitRepoSet) {
  const repoPaths = Object.keys(repos);
  for (let i = 0; i < repoPaths.length; i++) {
    if (path === repoPaths[i] || path.startsWith(repoPaths[i] + "/")) return true;
  }
  return false;
}

export function sortRepos(repos: GitRepoSet) {
  const repoPaths = Object.keys(repos).sort();
  const sorted: GitRepoSet = {};
  for (let i = 0; i < repoPaths.length; i++) {
    sorted[repoPaths[i]] = repos[repoPaths[i]];
  }
  return sorted;
}
