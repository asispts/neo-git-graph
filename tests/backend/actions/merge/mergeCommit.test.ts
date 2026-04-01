import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { mergeCommit } from "@/backend/actions/merge";

import { git, makeRepo } from "../../helpers";

let repo: string;
let featureCommitHash: string;

beforeAll(() => {
  repo = makeRepo();
  git(["checkout", "-b", "feature"], repo);
  fs.writeFileSync(path.join(repo, "feature.txt"), "feature");
  git(["add", "."], repo);
  git(["commit", "-m", "feature commit"], repo);
  featureCommitHash = cp
    .execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo })
    .toString()
    .trim();
  git(["checkout", "main"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

const makeGit = (p: string) => simpleGit({ baseDir: p, binary: "git" });

describe("mergeCommit", () => {
  it("merges a commit hash", async () => {
    const result = await mergeCommit(makeGit(repo), {
      commitHash: featureCommitHash,
      createNewCommit: false
    });
    expect(result).toEqual({ error: false });

    const log = cp.execFileSync("git", ["log", "--oneline"], { cwd: repo }).toString();
    expect(log).toContain("feature commit");
  });

  it("merges a commit hash with --no-ff when createNewCommit is true", async () => {
    git(["checkout", "-b", "feature2"], repo);
    fs.writeFileSync(path.join(repo, "feature2.txt"), "feature2");
    git(["add", "."], repo);
    git(["commit", "-m", "feature2 commit"], repo);
    const commit2Hash = cp
      .execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo })
      .toString()
      .trim();
    git(["checkout", "main"], repo);

    const result = await mergeCommit(makeGit(repo), {
      commitHash: commit2Hash,
      createNewCommit: true
    });
    expect(result).toEqual({ error: false });

    const log = cp.execFileSync("git", ["log", "--oneline"], { cwd: repo }).toString();
    expect(log).toContain("Merge commit");
  });

  it("returns error when the commit hash is invalid", async () => {
    const result = await mergeCommit(makeGit(repo), {
      commitHash: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      createNewCommit: false
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
