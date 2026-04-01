import simpleGit from "simple-git";

import { GitRepoSet } from "@/types";

export async function isGitRepository(repoPath: string, gitPath: string): Promise<boolean> {
  try {
    return await simpleGit({ baseDir: repoPath, binary: gitPath }).checkIsRepo();
  } catch {
    return false;
  }
}

export async function getRemoteUrl(repoPath: string, gitPath: string): Promise<string | null> {
  try {
    const url = await simpleGit({ baseDir: repoPath, binary: gitPath }).raw([
      "config",
      "--get",
      "remote.origin.url"
    ]);
    return url.trim() || null;
  } catch {
    return null;
  }
}

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
