import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "@/backend/features/gitClient";
import { gitCommitFactory } from "@/backend/features/gitCommit";

import { git, makeRepo } from "../helpers";

let repo: string;
let commitHash: string;

beforeAll(() => {
  repo = makeRepo();
  // Add a second commit to revert
  fs.writeFileSync(path.join(repo, "g"), "revert-me");
  git(["add", "."], repo);
  git(["commit", "-m", "second commit"], repo);
  commitHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("revert", () => {
  it("reverts a commit", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.revert(commitHash, 0);
    expect(result.error).toBe(false);

    expect(fs.existsSync(path.join(repo, "g"))).toBe(false);
  });

  it("returns error:true for a nonexistent commit hash", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.revert("0000000000000000000000000000000000000000", 0);
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
