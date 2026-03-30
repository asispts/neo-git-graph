import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "../../../../src/backend/features/gitClient";
import { gitCommitFactory } from "../../../../src/backend/features/gitCommit";
import { git, makeRepo } from "../helpers";

let repo: string;
let firstHash: string;

beforeAll(() => {
  repo = makeRepo();
  firstHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
  fs.writeFileSync(path.join(repo, "f"), "y");
  git(["add", "."], repo);
  git(["commit", "-m", "second"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("reset", () => {
  it("soft-resets to a previous commit", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.reset(firstHash, "soft");
    expect(result.error).toBe(false);

    const head = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    expect(head).toBe(firstHash);

    // restore for next tests
    git(["commit", "-m", "second"], repo);
  });

  it("mixed-resets to a previous commit", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.reset(firstHash, "mixed");
    expect(result.error).toBe(false);

    const head = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    expect(head).toBe(firstHash);

    // restore for next tests
    git(["add", "."], repo);
    git(["commit", "-m", "second"], repo);
  });

  it("hard-resets to a previous commit", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.reset(firstHash, "hard");
    expect(result.error).toBe(false);

    const head = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    expect(head).toBe(firstHash);
  });

  it("returns error:true for an invalid commit hash", async () => {
    const client = gitClientFactory(repo, "git");
    const commit = gitCommitFactory(client.getInstance);

    const result = await commit.reset("0000000000000000000000000000000000000000", "hard");
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
