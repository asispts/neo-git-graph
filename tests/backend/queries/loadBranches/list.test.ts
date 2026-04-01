import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadBranches } from "@/backend/queries/loadBranches";

import { git, makeRepo } from "../../helpers";

let simpleRepo: string;
let detachedRepo: string;
let repoWithRemote: string;

beforeAll(() => {
  simpleRepo = makeRepo();
  git(["branch", "feature/foo"], simpleRepo);

  detachedRepo = makeRepo();
  const hash = cp
    .execFileSync("git", ["rev-parse", "HEAD"], { cwd: detachedRepo })
    .toString()
    .trim();
  git(["checkout", "--detach", hash], detachedRepo);

  const remoteRepo = makeRepo();
  repoWithRemote = makeRepo();
  git(["remote", "add", "origin", remoteRepo], repoWithRemote);
  git(["fetch", "origin"], repoWithRemote);
});

afterAll(() => {
  fs.rmSync(simpleRepo, { recursive: true, force: true });
  fs.rmSync(detachedRepo, { recursive: true, force: true });
  fs.rmSync(repoWithRemote, { recursive: true, force: true });
});

describe("loadBranches", () => {
  it("head branch is first in the returned array", async () => {
    const result = await loadBranches(simpleGit(simpleRepo), {
      showRemoteBranches: false,
      hard: false,
      currentRepo: simpleRepo,
      gitPath: "git"
    });
    expect(result).toEqual({
      branches: expect.any(Array),
      head: "main",
      hard: false,
      isRepo: true
    });
    expect(result.branches[0]).toBe("main");
  });

  it("non-head branches are present", async () => {
    const result = await loadBranches(simpleGit(simpleRepo), {
      showRemoteBranches: false,
      hard: false,
      currentRepo: simpleRepo,
      gitPath: "git"
    });
    expect(result.branches).toContain("feature/foo");
  });

  it("detached HEAD yields head: null with branches still listed", async () => {
    const result = await loadBranches(simpleGit(detachedRepo), {
      showRemoteBranches: false,
      hard: false,
      currentRepo: detachedRepo,
      gitPath: "git"
    });
    expect(result).toEqual({
      branches: expect.any(Array),
      head: null,
      hard: false,
      isRepo: true
    });
    expect(result.branches.length).toBeGreaterThan(0);
  });

  it("excludes remote-tracking branches when showRemoteBranches is false", async () => {
    const result = await loadBranches(simpleGit(repoWithRemote), {
      showRemoteBranches: false,
      hard: false,
      currentRepo: repoWithRemote,
      gitPath: "git"
    });
    expect(result).toEqual({
      branches: expect.any(Array),
      head: expect.any(String),
      hard: false,
      isRepo: true
    });
    expect(result.branches.some((b) => b.startsWith("remotes/"))).toBe(false);
  });

  it("includes remote-tracking branches when showRemoteBranches is true", async () => {
    const result = await loadBranches(simpleGit(repoWithRemote), {
      showRemoteBranches: true,
      hard: false,
      currentRepo: repoWithRemote,
      gitPath: "git"
    });
    expect(result).toEqual({
      branches: expect.any(Array),
      head: expect.any(String),
      hard: false,
      isRepo: true
    });
    expect(result.branches.some((b) => b.startsWith("remotes/origin/"))).toBe(true);
  });

  it("returns isRepo: false for a non-git directory", async () => {
    const result = await loadBranches(simpleGit(os.tmpdir()), {
      showRemoteBranches: false,
      hard: false,
      currentRepo: os.tmpdir(),
      gitPath: "git"
    });
    expect(result).toEqual({
      branches: [],
      head: null,
      hard: false,
      isRepo: false
    });
  });

  it("passes hard flag through to the result", async () => {
    const result = await loadBranches(simpleGit(simpleRepo), {
      showRemoteBranches: false,
      hard: true,
      currentRepo: simpleRepo,
      gitPath: "git"
    });
    expect(result).toEqual({
      branches: expect.any(Array),
      head: expect.any(String),
      hard: true,
      isRepo: true
    });
  });
});
