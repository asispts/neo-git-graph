import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "../../../../src/backend/features/gitClient";
import { gitCommitFactory } from "../../../../src/backend/features/gitCommit";
import { git, makeRepo } from "../helpers";

let repo: string;
let repoWithRemote: string;
let remoteRepo: string;

beforeAll(() => {
  repo = makeRepo();
  fs.writeFileSync(path.join(repo, "f2"), "y");
  git(["add", "."], repo);
  git(["commit", "-m", "second"], repo);

  remoteRepo = makeRepo();
  repoWithRemote = makeRepo();
  git(["remote", "add", "origin", remoteRepo], repoWithRemote);
  git(["fetch", "origin"], repoWithRemote);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
  fs.rmSync(repoWithRemote, { recursive: true, force: true });
  fs.rmSync(remoteRepo, { recursive: true, force: true });
});

describe("getCommits", () => {
  it("returns commits with expected fields", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.list("", 300, false, "Author Date", false);
    expect(result.commits.length).toBeGreaterThan(0);
    const commit = result.commits[0];
    expect(typeof commit.hash).toBe("string");
    expect(typeof commit.author).toBe("string");
    expect(typeof commit.message).toBe("string");
    expect(typeof commit.date).toBe("number");
    expect(Array.isArray(commit.parentHashes)).toBe(true);
    expect(Array.isArray(commit.refs)).toBe(true);
  });

  it("attaches HEAD ref to the current commit and sets head correctly", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.list("", 300, false, "Author Date", false);
    expect(result.head).not.toBeNull();
    const headCommit = result.commits.find((c) => c.hash === result.head);
    expect(headCommit).toBeDefined();
    expect(headCommit!.refs.some((r) => r.type === "head")).toBe(true);
  });

  it("limits to maxCommits and sets moreCommitsAvailable true", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.list("", 1, false, "Author Date", false);
    expect(result.commits.length).toBe(1);
    expect(result.moreCommitsAvailable).toBe(true);
  });

  it("moreCommitsAvailable is false when all commits fit", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.list("", 300, false, "Author Date", false);
    expect(result.moreCommitsAvailable).toBe(false);
  });

  it("filters commits to the given branch", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.list("main", 300, false, "Author Date", false);
    expect(result.commits.length).toBeGreaterThan(0);
  });

  it("prepends uncommitted-changes commit when working tree is dirty", async () => {
    const dirtyRepo = makeRepo();
    try {
      fs.writeFileSync(path.join(dirtyRepo, "untracked"), "z");
      const client = gitClientFactory(dirtyRepo, "git");
      const gitCommits = gitCommitFactory(client.getInstance);
      const result = await gitCommits.list("", 300, false, "Author Date", true);
      expect(result.commits[0].hash).toBe("*");
      expect(result.commits[0].message).toMatch(/Uncommitted Changes \(\d+\)/);
      expect(result.commits[0].parentHashes).toEqual([result.head]);
    } finally {
      fs.rmSync(dirtyRepo, { recursive: true, force: true });
    }
  });

  it("does not prepend uncommitted-changes commit when showUncommittedChanges is false", async () => {
    const dirtyRepo = makeRepo();
    try {
      fs.writeFileSync(path.join(dirtyRepo, "untracked"), "z");
      const client = gitClientFactory(dirtyRepo, "git");
      const gitCommits = gitCommitFactory(client.getInstance);
      const result = await gitCommits.list("", 300, false, "Author Date", false);
      expect(result.commits[0].hash).not.toBe("*");
    } finally {
      fs.rmSync(dirtyRepo, { recursive: true, force: true });
    }
  });

  it("does not include remote refs when showRemoteBranches is false", async () => {
    const client = gitClientFactory(repoWithRemote, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.list("", 300, false, "Author Date", false);
    const allRefs = result.commits.flatMap((c) => c.refs);
    expect(allRefs.every((r) => r.type !== "remote")).toBe(true);
  });

  it("uses commit date when dateType is Commit Date", async () => {
    const client = gitClientFactory(repo, "git");
    const gitCommits = gitCommitFactory(client.getInstance);
    const result = await gitCommits.list("", 300, false, "Commit Date", false);
    expect(result.commits.length).toBeGreaterThan(0);
    expect(typeof result.commits[0].date).toBe("number");
    expect(result.commits[0].date).toBeGreaterThan(0);
  });

  it("setRepo reflects in gitCommits without recreating the factory", async () => {
    const repo2 = makeRepo();
    fs.writeFileSync(path.join(repo2, "other"), "q");
    git(["add", "."], repo2);
    git(["commit", "-m", "repo2-commit"], repo2);
    try {
      const client = gitClientFactory(repo, "git");
      const gitCommits = gitCommitFactory(client.getInstance);

      const result1 = await gitCommits.list("", 300, false, "Author Date", false);
      const msgs1 = result1.commits.map((c) => c.message);
      expect(msgs1).toContain("second");
      expect(msgs1).not.toContain("repo2-commit");

      client.setRepo(repo2);

      const result2 = await gitCommits.list("", 300, false, "Author Date", false);
      const msgs2 = result2.commits.map((c) => c.message);
      expect(msgs2).toContain("repo2-commit");
      expect(msgs2).not.toContain("second");
    } finally {
      fs.rmSync(repo2, { recursive: true, force: true });
    }
  });
});
