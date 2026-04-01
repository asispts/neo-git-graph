import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { revertCommit } from "@/backend/actions/commit";

import { git, makeRepo } from "../../helpers";

let repo: string;
let commitHash: string;

beforeAll(() => {
  repo = makeRepo();
  fs.writeFileSync(path.join(repo, "g"), "revert-me");
  git(["add", "."], repo);
  git(["commit", "-m", "second commit"], repo);
  commitHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

const makeGit = (p: string) => simpleGit({ baseDir: p, binary: "git" });

describe("revertCommit", () => {
  it("reverts a commit", async () => {
    const result = await revertCommit(makeGit(repo), { commitHash, parentIndex: 0 });
    expect(result).toEqual({ error: false });
    expect(fs.existsSync(path.join(repo, "g"))).toBe(false);
  });

  it("returns error for a nonexistent commit hash", async () => {
    const result = await revertCommit(makeGit(repo), {
      commitHash: "0000000000000000000000000000000000000000",
      parentIndex: 0
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
