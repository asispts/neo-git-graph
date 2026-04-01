import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { mergeBranch } from "@/backend/actions/merge";

import { git, makeRepo } from "../../helpers";

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
    await mergeBranch(simpleGit(repo), {
      branchName: "feature",
      createNewCommit: false
    });

    const log = cp.execFileSync("git", ["log", "--oneline"], { cwd: repo }).toString();
    expect(log).toContain("feature commit");
  });

  it("merges a branch with --no-ff when createNewCommit is true", async () => {
    git(["checkout", "-b", "feature2"], repo);
    fs.writeFileSync(path.join(repo, "feature2.txt"), "feature2");
    git(["add", "."], repo);
    git(["commit", "-m", "feature2 commit"], repo);
    git(["checkout", "main"], repo);

    await mergeBranch(simpleGit(repo), {
      branchName: "feature2",
      createNewCommit: true
    });

    const log = cp.execFileSync("git", ["log", "--oneline"], { cwd: repo }).toString();
    expect(log).toContain("Merge branch");
  });

  it("throws when the branch does not exist", async () => {
    await expect(
      mergeBranch(simpleGit(repo), {
        branchName: "nonexistent-branch",
        createNewCommit: false
      })
    ).rejects.toThrow();
  });
});
