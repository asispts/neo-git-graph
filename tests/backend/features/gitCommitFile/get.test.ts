import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "../../../../src/backend/features/gitClient";
import { gitCommitFileFactory } from "../../../../src/backend/features/gitCommitFile";
import { git, makeRepo } from "../helpers";

let repo: string;
let commitHash: string;

beforeAll(() => {
  repo = makeRepo();
  commitHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("get", () => {
  it("returns the file content at a given commit", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommitFile = gitCommitFileFactory(client.getInstance);
    const result = await gitCommitFile.get(repo, commitHash, "f");
    expect(result).toBe("x");
  });

  it("returns empty string for a non-existent file path", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommitFile = gitCommitFileFactory(client.getInstance);
    const result = await gitCommitFile.get(repo, commitHash, "does-not-exist");
    expect(result).toBe("");
  });

  it("returns empty string for an invalid commit hash", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommitFile = gitCommitFileFactory(client.getInstance);
    const result = await gitCommitFile.get(repo, "deadbeef1234", "f");
    expect(result).toBe("");
  });

  it("returns updated content after a new commit", async () => {
    const repo2 = makeRepo();
    try {
      fs.writeFileSync(path.join(repo2, "f"), "updated");
      git(["add", "."], repo2);
      git(["-c", "commit.gpgsign=false", "commit", "-m", "update"], repo2);
      const hash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo2 }).toString().trim();
      const client = gitClientFactory(repo2, "git");
      const gitCommitFile = gitCommitFileFactory(client.getInstance);
      const result = await gitCommitFile.get(repo2, hash, "f");
      expect(result).toBe("updated");
    } finally {
      fs.rmSync(repo2, { recursive: true, force: true });
    }
  });

  it("respects repo arg even when client was initialised with a different repo", async () => {
    const repo2 = makeRepo();
    try {
      const hash2 = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo2 }).toString().trim();
      const client = gitClientFactory(repo, "git");
      const gitCommitFile = gitCommitFileFactory(client.getInstance);
      const result = await gitCommitFile.get(repo2, hash2, "f");
      expect(result).toBe("x");
    } finally {
      fs.rmSync(repo2, { recursive: true, force: true });
    }
  });
});
