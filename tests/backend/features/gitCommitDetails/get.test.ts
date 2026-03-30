import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "../../../../src/backend/features/gitClient";
import { gitCommitFactory } from "../../../../src/backend/features/gitCommit";
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
  it("returns commit details with expected fields", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.details(commitHash, "Author Date");
    expect(result).not.toBeNull();
    expect(result!.hash).toBe(commitHash);
    expect(typeof result!.author).toBe("string");
    expect(typeof result!.email).toBe("string");
    expect(typeof result!.date).toBe("number");
    expect(result!.date).toBeGreaterThan(0);
    expect(typeof result!.committer).toBe("string");
    expect(typeof result!.body).toBe("string");
    expect(Array.isArray(result!.parents)).toBe(true);
    expect(Array.isArray(result!.fileChanges)).toBe(true);
  });

  it("returns file changes for the initial commit", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.details(commitHash, "Author Date");
    expect(result).not.toBeNull();
    expect(result!.fileChanges.length).toBeGreaterThan(0);
  });

  it("returns null for an invalid commit hash", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.details("deadbeef1234", "Author Date");
    expect(result).toBeNull();
  });

  it("includes additions and deletions for a modified file", async () => {
    const repo2 = makeRepo();
    try {
      fs.writeFileSync(path.join(repo2, "f"), "modified content");
      git(["add", "."], repo2);
      git(["commit", "-m", "mod"], repo2);
      const hash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo2 }).toString().trim();
      const client = gitClientFactory(repo2, "git");
      const gitCommits = gitCommitFactory(client.getInstance);
      const result = await gitCommits.details(hash, "Author Date");
      expect(result).not.toBeNull();
      const changed = result!.fileChanges.find((f) => f.newFilePath === "f");
      expect(changed).toBeDefined();
      expect(typeof changed!.additions).toBe("number");
      expect(typeof changed!.deletions).toBe("number");
    } finally {
      fs.rmSync(repo2, { recursive: true, force: true });
    }
  });

  it("uses commit date when dateType is Commit Date", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.details(commitHash, "Commit Date");
    expect(result).not.toBeNull();
    expect(result!.date).toBeGreaterThan(0);
  });

  it("body contains the commit message", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.details(commitHash, "Author Date");
    expect(result).not.toBeNull();
    expect(result!.body).toContain("init");
  });

  it("setRepo reflects without recreating the factory", async () => {
    const repo2 = makeRepo();
    try {
      const hash2 = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo2 }).toString().trim();
      const client = gitClientFactory(repo, "git");
      const gitCommits = gitCommitFactory(client.getInstance);

      const result1 = await gitCommits.details(commitHash, "Author Date");
      expect(result1).not.toBeNull();
      expect(result1!.hash).toBe(commitHash);

      client.setRepo(repo2);

      const result2 = await gitCommits.details(hash2, "Author Date");
      expect(result2).not.toBeNull();
      expect(result2!.hash).toBe(hash2);
    } finally {
      fs.rmSync(repo2, { recursive: true, force: true });
    }
  });
});
