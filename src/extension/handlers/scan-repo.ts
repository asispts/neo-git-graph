import fs from "node:fs/promises";
import path from "node:path";

import { simpleGit } from "simple-git";
import * as vscode from "vscode";

import { extConfig } from "@/extension/config";
import { logger } from "@/extension/util/logger";
import type { GitRepo, ScanRepoResult } from "@/types";

export async function scanRepos(): Promise<ScanRepoResult> {
  const workspaceDirs = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  const gitBinary = extConfig.gitBinary();
  const repos = await startScan(gitBinary, workspaceDirs, extConfig.maxDepth());
  logger.info(`Repository scan completed: ${repos.length} found; Git binary: ${gitBinary}`);

  return {
    repos
  };
}

async function startScan(gitBinary: string, paths: string[], maxDepth: number): Promise<GitRepo[]> {
  const repos = await Promise.all(
    paths.map((directory) => scanDirectory(gitBinary, directory, maxDepth))
  );
  return repos.flat().toSorted((a, b) => a.path.localeCompare(b.path));
}

async function scanDirectory(
  gitBinary: string,
  directory: string,
  depth: number
): Promise<GitRepo[]> {
  const isRepo = await simpleGit({ baseDir: directory, binary: gitBinary })
    .checkIsRepo()
    .catch((error: unknown) => {
      logger.warn(`Failed to check Git repository: ${directory}; Git binary: ${gitBinary}`, error);
      return false;
    });

  if (isRepo) {
    return [{ name: path.basename(directory), path: directory }];
  }

  if (depth <= 0) {
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const repos = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && entry.name !== ".git")
      .map((entry) => scanDirectory(gitBinary, path.join(directory, entry.name), depth - 1))
  );

  return repos.flat();
}
