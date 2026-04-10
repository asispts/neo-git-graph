import * as vscode from "vscode";

import { searchDirectoryForRepos } from "@/backend/utils/repoSearch";

export async function findGitRepos(
  paths: string[],
  gitPath: string,
  maxDepth: number
): Promise<string[]> {
  const results = await Promise.all(
    paths.map((p) => searchDirectoryForRepos(p, maxDepth, gitPath, []))
  );
  return results.flat();
}

export function bootstrap(_ctx: vscode.ExtensionContext, _repos: string[]): void {}
