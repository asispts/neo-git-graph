import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resetToCommit } from "@/backend/actions/commit";

import { git, makeRepo } from "../../helpers";

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

const makeGit = (p: string) => simpleGit({ baseDir: p, binary: "git" });

describe("resetToCommit", () => {
  it("soft-resets to a previous commit", async () => {
    const result = await resetToCommit(makeGit(repo), { commitHash: firstHash, resetMode: "soft" });
    expect(result).toEqual({ error: false });

    const head = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    expect(head).toBe(firstHash);

    git(["commit", "-m", "second"], repo);
  });

  it("mixed-resets to a previous commit", async () => {
    const result = await resetToCommit(makeGit(repo), {
      commitHash: firstHash,
      resetMode: "mixed"
    });
    expect(result).toEqual({ error: false });

    const head = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    expect(head).toBe(firstHash);

    git(["add", "."], repo);
    git(["commit", "-m", "second"], repo);
  });

  it("hard-resets to a previous commit", async () => {
    const result = await resetToCommit(makeGit(repo), { commitHash: firstHash, resetMode: "hard" });
    expect(result).toEqual({ error: false });

    const head = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    expect(head).toBe(firstHash);
  });

  it("returns error for an invalid commit hash", async () => {
    const result = await resetToCommit(makeGit(repo), {
      commitHash: "0000000000000000000000000000000000000000",
      resetMode: "hard"
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
