import * as cp from "node:child_process";
import * as fs from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitBranchFactory } from "@/backend/features/gitBranch";
import { gitClientFactory } from "@/backend/features/gitClient";

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

describe("create", () => {
  it("creates a new branch at the given commit", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.create("new-branch", commitHash);
    expect(result.error).toBe(false);

    const listResult = await branch.list(false);
    expect(listResult.branches).toContain("new-branch");
  });

  it("returns error:true when the branch already exists", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.create("main", commitHash);
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("returns error:true when the commit hash is invalid", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.create("bad-branch", "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
    expect(result.error).toBe(true);
  });
});
