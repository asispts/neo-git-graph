import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitBranchFactory } from "@/backend/features/gitBranch";
import { gitClientFactory } from "@/backend/features/gitClient";

import { git, makeRepo } from "../helpers";

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");

let simpleRepo: string;
let detachedRepo: string;
let repoWithRemote: string;
let secondRepo: string;

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

  secondRepo = makeRepo();
  git(["branch", "feature/bar"], secondRepo);
});

afterAll(() => {
  fs.rmSync(simpleRepo, { recursive: true, force: true });
  fs.rmSync(detachedRepo, { recursive: true, force: true });
  fs.rmSync(repoWithRemote, { recursive: true, force: true });
  fs.rmSync(secondRepo, { recursive: true, force: true });
});

describe("list", () => {
  it("head branch is first in the returned array", async () => {
    const client = gitClientFactory(simpleRepo, "git");
    const branch = gitBranchFactory(client.getInstance);
    const result = await branch.list(false);
    expect(result.error).toBe(false);
    expect(result.head).not.toBeNull();
    expect(result.branches[0]).toBe(result.head);
  });

  it("non-head branches are present", async () => {
    const client = gitClientFactory(simpleRepo, "git");
    const branch = gitBranchFactory(client.getInstance);
    const result = await branch.list(false);
    expect(result.branches).toContain("feature/foo");
  });

  it("detached HEAD yields head: null with branches still listed", async () => {
    const client = gitClientFactory(detachedRepo, "git");
    const branch = gitBranchFactory(client.getInstance);
    const result = await branch.list(false);
    expect(result.error).toBe(false);
    expect(result.head).toBeNull();
    expect(result.branches.length).toBeGreaterThan(0);
  });

  it("excludes remote-tracking branches when showRemoteBranches is false", async () => {
    const client = gitClientFactory(PROJECT_ROOT, "git");
    const branch = gitBranchFactory(client.getInstance);
    const result = await branch.list(false);
    expect(result.error).toBe(false);
    expect(result.branches.some((b) => b.startsWith("remotes/"))).toBe(false);
  });

  it("includes remote-tracking branches when showRemoteBranches is true", async () => {
    const client = gitClientFactory(repoWithRemote, "git");
    const branch = gitBranchFactory(client.getInstance);
    const result = await branch.list(true);
    expect(result.error).toBe(false);
    expect(result.branches.some((b) => b.startsWith("remotes/origin/"))).toBe(true);
  });

  it("returns error:true for a non-git directory", async () => {
    const client = gitClientFactory(os.tmpdir(), "git");
    const branch = gitBranchFactory(client.getInstance);
    const result = await branch.list(false);
    expect(result.error).toBe(true);
    expect(result.branches).toEqual([]);
    expect(result.head).toBeNull();
  });

  it("setRepo reflects in gitBranch without recreating it", async () => {
    const client = gitClientFactory(simpleRepo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result1 = await branch.list(false);
    expect(result1.branches).toContain("feature/foo");
    expect(result1.branches).not.toContain("feature/bar");

    client.setRepo(secondRepo);

    const result2 = await branch.list(false);
    expect(result2.branches).toContain("feature/bar");
    expect(result2.branches).not.toContain("feature/foo");
  });
});
