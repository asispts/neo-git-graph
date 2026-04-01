import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deleteBranch } from "@/backend/actions/branch";

import { git, makeRepo } from "../../helpers";

let repo: string;

beforeAll(() => {
  repo = makeRepo();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("deleteBranch", () => {
  it("deletes an existing branch", async () => {
    git(["branch", "to-delete"], repo);

    const result = await deleteBranch(simpleGit(repo), {
      branchName: "to-delete",
      forceDelete: false
    });
    expect(result).toEqual({ error: false });

    const listed = cp
      .execFileSync("git", ["branch", "--list", "to-delete"], { cwd: repo })
      .toString()
      .trim();
    expect(listed).toBe("");
  });

  it("returns error when deleting a branch with unmerged changes without force", async () => {
    git(["checkout", "-b", "unmerged"], repo);
    fs.writeFileSync(path.join(repo, "g"), "y");
    git(["add", "."], repo);
    git(["commit", "-m", "unmerged commit"], repo);
    git(["checkout", "main"], repo);

    const result = await deleteBranch(simpleGit(repo), {
      branchName: "unmerged",
      forceDelete: false
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });

  it("force-deletes a branch with unmerged changes", async () => {
    const result = await deleteBranch(simpleGit(repo), {
      branchName: "unmerged",
      forceDelete: true
    });
    expect(result).toEqual({ error: false });

    const listed = cp
      .execFileSync("git", ["branch", "--list", "unmerged"], { cwd: repo })
      .toString()
      .trim();
    expect(listed).toBe("");
  });

  it("returns error when the branch does not exist", async () => {
    const result = await deleteBranch(simpleGit(repo), {
      branchName: "nonexistent",
      forceDelete: false
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
