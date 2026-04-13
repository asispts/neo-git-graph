import * as cp from "node:child_process";
import * as fs from "node:fs";

import { simpleGit } from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { renameBranch } from "@/backend/actions/branch";

import { git, makeRepo } from "@tests/backend/helpers";

let repo: string;

beforeAll(() => {
  repo = makeRepo();
  git(["branch", "old-name"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("renameBranch", () => {
  it("renames an existing branch", async () => {
    await renameBranch(simpleGit(repo), {
      oldName: "old-name",
      newName: "new-name"
    });

    const listedOld = cp
      .execFileSync("git", ["branch", "--list", "old-name"], { cwd: repo })
      .toString()
      .trim();
    const listedNew = cp
      .execFileSync("git", ["branch", "--list", "new-name"], { cwd: repo })
      .toString()
      .trim();
    expect(listedOld).toBe("");
    expect(listedNew).toBe("new-name");
  });

  it("throws when the source branch does not exist", async () => {
    await expect(
      renameBranch(simpleGit(repo), {
        oldName: "nonexistent-branch",
        newName: "whatever"
      })
    ).rejects.toThrow();
  });

  it("throws when the target branch already exists", async () => {
    await expect(
      renameBranch(simpleGit(repo), { oldName: "new-name", newName: "main" })
    ).rejects.toThrow();
  });
});
