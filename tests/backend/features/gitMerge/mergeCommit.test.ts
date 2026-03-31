import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "@/backend/features/gitClient";
import { gitMergeFactory } from "@/backend/features/gitMerge";

import { git, makeRepo } from "../helpers";

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

describe("mergeCommit", () => {
  it("merges a commit hash", async () => {
    const client = gitClientFactory(repo, "git");
    const merge = gitMergeFactory(client.getInstance);

    const result = await merge.mergeCommit(featureCommitHash, false);
    expect(result.error).toBe(false);

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

    const client2 = gitClientFactory(repo, "git");
    const merge2 = gitMergeFactory(client2.getInstance);
    const result = await merge2.mergeCommit(commit2Hash, true);
    expect(result.error).toBe(false);

    const log = cp.execFileSync("git", ["log", "--oneline"], { cwd: repo }).toString();
    expect(log).toContain("Merge commit");
  });

  it("returns error:true when the commit hash is invalid", async () => {
    const client = gitClientFactory(repo, "git");
    const merge = gitMergeFactory(client.getInstance);

    const result = await merge.mergeCommit("deadbeefdeadbeefdeadbeefdeadbeefdeadbeef", false);
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
