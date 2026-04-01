import * as cp from "node:child_process";
import * as fs from "node:fs";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createBranch } from "@/backend/actions/branch";

import { makeRepo } from "../../helpers";

let repo: string;
let commitHash: string;

beforeAll(() => {
  repo = makeRepo();
  commitHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

const makeGit = (path: string) => simpleGit({ baseDir: path, binary: "git" });

describe("createBranch", () => {
  it("creates a new branch at the given commit", async () => {
    const result = await createBranch(makeGit(repo), {
      branchName: "new-branch",
      commitHash
    });
    expect(result).toEqual({ error: false });

    const listed = cp
      .execFileSync("git", ["branch", "--list", "new-branch"], { cwd: repo })
      .toString()
      .trim();
    expect(listed).toBe("new-branch");
  });

  it("returns error when the branch already exists", async () => {
    const result = await createBranch(makeGit(repo), { branchName: "main", commitHash });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });

  it("returns error when the commit hash is invalid", async () => {
    const result = await createBranch(makeGit(repo), {
      branchName: "bad-branch",
      commitHash: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
