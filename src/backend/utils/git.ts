import { simpleGit } from "simple-git";

export async function getGitVersion(gitPath: string): Promise<string | null> {
  try {
    const result = await simpleGit({ binary: gitPath }).version();
    return `${result.major}.${result.minor}.${result.patch}`;
  } catch {
    return null;
  }
}

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
