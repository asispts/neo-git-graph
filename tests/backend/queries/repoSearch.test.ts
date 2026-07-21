import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findGitRepos } from "@/backend/queries/repoSearch";

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

  initRepo(repoA);
  initRepo(repoB);
  fs.mkdirSync(path.join(tmpDir, "plain"));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("findGitRepos", () => {
  it("returns [] when paths is empty", async () => {
    expect(await findGitRepos([], "git", 2)).toEqual([]);
  });

  it("finds a repo when the path itself is a git repo", async () => {
    expect(await findGitRepos([repoA], "git", 0)).toEqual([repoA]);
  });

  it("returns [] when path is not a repo and maxDepth is 0", async () => {
    expect(await findGitRepos([path.join(tmpDir, "plain")], "git", 0)).toEqual([]);
  });

  it("returns [] for a non-existent path", async () => {
    expect(await findGitRepos(["/tmp/ngg-does-not-exist-xyz"], "git", 2)).toEqual([]);
  });

  it("finds a repo nested at depth 1", async () => {
    expect(await findGitRepos([tmpDir], "git", 1)).toContain(repoA);
  });

  it("does not find a repo beyond maxDepth", async () => {
    expect(await findGitRepos([tmpDir], "git", 1)).not.toContain(repoB);
  });

  it("finds a repo exactly at maxDepth", async () => {
    expect(await findGitRepos([tmpDir], "git", 2)).toContain(repoB);
  });

  it("aggregates repos across multiple workspace paths", async () => {
    const nestedDir = path.join(tmpDir, "nested");
    const result = await findGitRepos([repoA, nestedDir], "git", 1);
    expect(result.toSorted()).toEqual([repoA, repoB].toSorted());
  });

  it("does not report .git directories as repos", async () => {
    const result = await findGitRepos([tmpDir], "git", 2);
    expect(result.every((r) => !r.endsWith("/.git"))).toBe(true);
  });
});
