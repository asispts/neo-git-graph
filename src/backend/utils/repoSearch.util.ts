import * as fs from "node:fs/promises";

import { isGitRepository } from "@/backend/utils/git.util";
import { evalPromises } from "@/backend/utils/promise.util";

async function isDirectory(path: string): Promise<boolean> {
  return fs
    .stat(path)
    .then((s) => s.isDirectory())
    .catch(() => false);
}

export async function searchDirectoryForRepos(
  directory: string,
  maxDepth: number,
  gitPath: string,
  knownRepoPaths: string[]
): Promise<string[]> {
  if (knownRepoPaths.some((r) => directory === r || directory.startsWith(r + "/"))) {
    return [];
  }

  const isRepo = await isGitRepository(directory, gitPath);
  if (isRepo) {
    return [directory];
  }

  if (maxDepth <= 0) {
    return [];
  }

  const dirContents = await fs.readdir(directory).catch(() => null);
  if (dirContents === null) {
    return [];
  }

  const dirs: string[] = [];
  for (let i = 0; i < dirContents.length; i++) {
    if (dirContents[i] !== ".git" && (await isDirectory(directory + "/" + dirContents[i]))) {
      dirs.push(directory + "/" + dirContents[i]);
    }
  }

  const results = await evalPromises(dirs, 2, (dir) =>
    searchDirectoryForRepos(dir, maxDepth - 1, gitPath, knownRepoPaths)
  );
  return results.flat();
}
