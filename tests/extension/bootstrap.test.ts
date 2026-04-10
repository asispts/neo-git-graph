import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findGitRepos } from "@/extension/bootstrap";

import { git } from "@tests/backend/helpers";

// Directory layout created in beforeAll:
//   tmpDir/
//     repo-a/          ← git repo (depth 1 from tmpDir)
//     plain/           ← plain directory, no git
//     nested/
//       repo-b/        ← git repo (depth 2 from tmpDir)

let tmpDir: string;
let repoA: string;
let repoB: string;
let plain: string;

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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ngg-bootstrap-"));
  repoA = path.join(tmpDir, "repo-a");
  repoB = path.join(tmpDir, "nested", "repo-b");
  plain = path.join(tmpDir, "plain");

  initRepo(repoA);
  initRepo(repoB);
  fs.mkdirSync(plain);
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("findGitRepos", () => {
  it("returns [] when paths is empty", async () => {
    const result = await findGitRepos([], "git", 2);
    expect(result).toEqual([]);
  });

  it("finds a repo when the path itself is a git repo (depth 0)", async () => {
    const result = await findGitRepos([repoA], "git", 0);
    expect(result).toEqual([repoA]);
  });

  it("returns [] when path is not a repo and maxDepth is 0", async () => {
    const result = await findGitRepos([plain], "git", 0);
    expect(result).toEqual([]);
  });

  it("returns [] for a non-existent path", async () => {
    const result = await findGitRepos(["/tmp/ngg-does-not-exist-xyz"], "git", 2);
    expect(result).toEqual([]);
  });

  it("finds a repo nested at depth 1", async () => {
    const result = await findGitRepos([tmpDir], "git", 1);
    expect(result).toContain(repoA);
  });

  it("does not find a repo beyond maxDepth", async () => {
    // repoB is at depth 2 from tmpDir
    const result = await findGitRepos([tmpDir], "git", 1);
    expect(result).not.toContain(repoB);
  });

  it("finds a repo exactly at maxDepth", async () => {
    // repoB is at depth 2 from tmpDir
    const result = await findGitRepos([tmpDir], "git", 2);
    expect(result).toContain(repoB);
  });

  it("finds multiple repos at the same depth", async () => {
    const result = await findGitRepos([tmpDir], "git", 1);
    const repoC = path.join(tmpDir, "repo-c");
    initRepo(repoC);
    try {
      const result2 = await findGitRepos([tmpDir], "git", 1);
      expect(result2).toContain(repoA);
      expect(result2).toContain(repoC);
    } finally {
      fs.rmSync(repoC, { recursive: true, force: true });
    }

    // original result should only have repoA at depth 1
    expect(result).toContain(repoA);
  });

  it("aggregates repos across multiple workspace paths", async () => {
    const nestedDir = path.join(tmpDir, "nested");
    const result = await findGitRepos([repoA, nestedDir], "git", 1);
    expect(result.sort()).toEqual([repoA, repoB].sort());
  });

  it("does not report .git directories as repos", async () => {
    const result = await findGitRepos([tmpDir], "git", 2);
    expect(result.every((r) => !r.endsWith("/.git"))).toBe(true);
  });
});
