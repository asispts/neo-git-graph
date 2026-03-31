import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "@/backend/features/gitClient";
import { gitCommitFactory } from "@/backend/features/gitCommit";

import { git, makeRepo } from "../helpers";

let repo: string;
let cherrypickHash: string;

beforeAll(() => {
  repo = makeRepo();
  // Create a commit on a side branch to cherry-pick
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

describe("cherrypick", () => {
  it("cherry-picks a commit onto the current branch", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.cherrypick(cherrypickHash, 0);
    expect(result.error).toBe(false);

    expect(fs.existsSync(path.join(repo, "g"))).toBe(true);
  });

  it("returns error:true for a nonexistent commit hash", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.cherrypick("0000000000000000000000000000000000000000", 0);
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
