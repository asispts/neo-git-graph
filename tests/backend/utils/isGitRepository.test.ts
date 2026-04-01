import * as fs from "node:fs";
import * as os from "node:os";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { isGitRepository } from "@/backend/utils/git.util";

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
    expect(await isGitRepository(repo, "git")).toBe(true);
  });

  it("returns false for a non-git directory", async () => {
    expect(await isGitRepository(nonGitDir, "git")).toBe(false);
  });

  it("returns false for a non-existent path", async () => {
    expect(await isGitRepository("/tmp/ngg-test-does-not-exist-xyz", "git")).toBe(false);
  });
});
