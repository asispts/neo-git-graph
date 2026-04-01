import * as cp from "node:child_process";
import * as fs from "node:fs";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { checkoutCommit } from "@/backend/actions/commit";

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

describe("checkoutCommit", () => {
  it("checks out a commit hash (detaches HEAD)", async () => {
    const result = await checkoutCommit(simpleGit(repo), { commitHash });
    expect(result).toEqual({ error: false });

    const head = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    expect(head).toBe(commitHash);
  });

  it("returns error for a nonexistent commit hash", async () => {
    const result = await checkoutCommit(simpleGit(repo), {
      commitHash: "0000000000000000000000000000000000000000"
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
