import * as cp from "node:child_process";
import * as fs from "node:fs";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { renameBranch } from "@/backend/actions/branch";

import { git, makeRepo } from "../../helpers";

let repo: string;

beforeAll(() => {
  repo = makeRepo();
  git(["branch", "old-name"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

const makeGit = (path: string) => simpleGit({ baseDir: path, binary: "git" });

describe("renameBranch", () => {
  it("renames an existing branch", async () => {
    const result = await renameBranch(makeGit(repo), { oldName: "old-name", newName: "new-name" });
    expect(result).toEqual({ error: false });

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

  it("returns error when the source branch does not exist", async () => {
    const result = await renameBranch(makeGit(repo), {
      oldName: "nonexistent-branch",
      newName: "whatever"
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });

  it("returns error when the target branch already exists", async () => {
    const result = await renameBranch(makeGit(repo), { oldName: "new-name", newName: "main" });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
