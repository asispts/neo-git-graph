import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { searchDirectoryForRepos } from "@/backend/utils/repoSearch";

import { git } from "@tests/backend/helpers";

// Directory layout created in beforeAll:
//   tmpDir/
//     repo-a/          ← git repo
//     not-a-repo/      ← plain directory
//     nested/
//       repo-b/        ← git repo (depth 2 from tmpDir)

let tmpDir: string;
let repoA: string;
let repoB: string;
let nonRepoDir: string;

function initRepo(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  try {
    git(["init", "-b", "main"], dir);
  } catch {
    git(["init"], dir);
    git(["checkout", "-b", "main"], dir);
  }
  git(["config", "user.email", "t@t.com"], dir);
  git(["config", "user.name", "T"], dir);
  git(["config", "commit.gpgsign", "false"], dir);
  fs.writeFileSync(path.join(dir, "f"), "x");
  git(["add", "."], dir);
  git(["commit", "-m", "init"], dir);
}

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ngg-search-"));
  repoA = path.join(tmpDir, "repo-a");
  repoB = path.join(tmpDir, "nested", "repo-b");
  nonRepoDir = path.join(tmpDir, "not-a-repo");

  initRepo(repoA);
  initRepo(repoB);
  fs.mkdirSync(nonRepoDir);
  fs.writeFileSync(path.join(nonRepoDir, "readme.txt"), "hello");
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("searchDirectoryForRepos", () => {
  it("finds a repo at the given directory (depth 0)", async () => {
    const result = await searchDirectoryForRepos(repoA, 0, "git", []);
    expect(result).toEqual([repoA]);
  });

  it("returns [] for a non-repo at depth 0", async () => {
    const result = await searchDirectoryForRepos(nonRepoDir, 0, "git", []);
    expect(result).toEqual([]);
  });

  it("returns [] for a non-existent directory", async () => {
    const result = await searchDirectoryForRepos("/tmp/ngg-does-not-exist-xyz", 0, "git", []);
    expect(result).toEqual([]);
  });

  it("skips directory already in knownRepoPaths", async () => {
    const result = await searchDirectoryForRepos(repoA, 0, "git", [repoA]);
    expect(result).toEqual([]);
  });

  it("skips subdirectory of a known repo", async () => {
    const sub = path.join(repoA, "src");
    fs.mkdirSync(sub);
    try {
      const result = await searchDirectoryForRepos(sub, 0, "git", [repoA]);
      expect(result).toEqual([]);
    } finally {
      fs.rmdirSync(sub);
    }
  });

  it("respects maxDepth=0: does not recurse into non-repo", async () => {
    const result = await searchDirectoryForRepos(tmpDir, 0, "git", []);
    expect(result).toEqual([]);
  });

  it("finds repos at depth 1", async () => {
    const result = await searchDirectoryForRepos(tmpDir, 1, "git", []);
    expect(result).toEqual([repoA]);
  });

  it("finds nested repos when depth allows", async () => {
    const result = await searchDirectoryForRepos(tmpDir, 2, "git", []);
    expect(result.toSorted()).toEqual([repoA, repoB].toSorted());
  });

  it("does not return .git subdirectory as a repo", async () => {
    const result = await searchDirectoryForRepos(tmpDir, 2, "git", []);
    expect(result.every((r) => !r.includes("/.git"))).toBe(true);
  });
});
