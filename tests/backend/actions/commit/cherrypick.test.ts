import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { simpleGit } from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cherrypickCommit } from "@/backend/actions/commit";

import { git, makeRepo } from "@tests/backend/helpers";

let repo: string;
let cherrypickHash: string;

beforeAll(() => {
  repo = makeRepo();
  git(["checkout", "-b", "side"], repo);
  fs.writeFileSync(path.join(repo, "g"), "cherry");
  git(["add", "."], repo);
  git(["commit", "-m", "cherry commit"], repo);
  cherrypickHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
  git(["checkout", "main"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("cherrypickCommit", () => {
  it("cherry-picks a commit onto the current branch", async () => {
    await cherrypickCommit(simpleGit(repo), {
      commitHash: cherrypickHash,
      parentIndex: 0
    });
    expect(fs.existsSync(path.join(repo, "g"))).toBe(true);
  });

  it("throws for a nonexistent commit hash", async () => {
    await expect(
      cherrypickCommit(simpleGit(repo), {
        commitHash: "0000000000000000000000000000000000000000",
        parentIndex: 0
      })
    ).rejects.toThrow();
  });
});
