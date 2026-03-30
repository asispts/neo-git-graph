import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "../../../../src/backend/features/gitClient";
import { gitMergeFactory } from "../../../../src/backend/features/gitMerge";
import { git, makeRepo } from "../helpers";

let repo: string;

beforeAll(() => {
  repo = makeRepo();
  git(["checkout", "-b", "feature"], repo);
  fs.writeFileSync(path.join(repo, "feature.txt"), "feature");
  git(["add", "."], repo);
  git(["commit", "-m", "feature commit"], repo);
  git(["checkout", "main"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("mergeBranch", () => {
  it("merges a branch with fast-forward by default", async () => {
    const client = gitClientFactory(repo, "git");
    const merge = gitMergeFactory(client.getInstance);

    const result = await merge.mergeBranch("feature", false);
    expect(result.error).toBe(false);

    const log = cp.execFileSync("git", ["log", "--oneline"], { cwd: repo }).toString();
    expect(log).toContain("feature commit");
  });

  it("merges a branch with --no-ff when createNewCommit is true", async () => {
    git(["checkout", "-b", "feature2"], repo);
    fs.writeFileSync(path.join(repo, "feature2.txt"), "feature2");
    git(["add", "."], repo);
    git(["commit", "-m", "feature2 commit"], repo);
    git(["checkout", "main"], repo);

    const client2 = gitClientFactory(repo, "git");
    const merge2 = gitMergeFactory(client2.getInstance);
    const result = await merge2.mergeBranch("feature2", true);
    expect(result.error).toBe(false);

    const log = cp.execFileSync("git", ["log", "--oneline"], { cwd: repo }).toString();
    expect(log).toContain("Merge branch");
  });

  it("returns error:true when the branch does not exist", async () => {
    const client = gitClientFactory(repo, "git");
    const merge = gitMergeFactory(client.getInstance);

    const result = await merge.mergeBranch("nonexistent-branch", false);
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
