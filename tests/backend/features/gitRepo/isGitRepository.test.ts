import * as fs from "node:fs";
import * as os from "node:os";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitRepoFactory } from "@/backend/features/gitRepo";

import { makeRepo } from "../helpers";

let repo: string;
let nonGitDir: string;

beforeAll(() => {
  repo = makeRepo();
  nonGitDir = fs.mkdtempSync(os.tmpdir() + "/ngg-test-nongit-");
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
  fs.rmSync(nonGitDir, { recursive: true, force: true });
});

describe("isGitRepository", () => {
  it("returns true for a git repository", async () => {
    const gitRepo = gitRepoFactory("git");
    expect(await gitRepo.isGitRepository(repo)).toBe(true);
  });

  it("returns false for a non-git directory", async () => {
    const gitRepo = gitRepoFactory("git");
    expect(await gitRepo.isGitRepository(nonGitDir)).toBe(false);
  });

  it("returns false for a non-existent path", async () => {
    const gitRepo = gitRepoFactory("git");
    expect(await gitRepo.isGitRepository("/tmp/ngg-test-does-not-exist-xyz")).toBe(false);
  });
});
