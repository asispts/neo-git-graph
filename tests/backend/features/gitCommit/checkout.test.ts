import * as cp from "node:child_process";
import * as fs from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "@/backend/features/gitClient";
import { gitCommitFactory } from "@/backend/features/gitCommit";

import { makeRepo } from "../helpers";

let repo: string;
let commitHash: string;

beforeAll(() => {
  repo = makeRepo();
  commitHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("checkout", () => {
  it("checks out a commit hash (detaches HEAD)", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.checkout(commitHash);
    expect(result.error).toBe(false);

    const head = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    expect(head).toBe(commitHash);
  });

  it("returns error:true for a nonexistent commit hash", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.checkout("0000000000000000000000000000000000000000");
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
