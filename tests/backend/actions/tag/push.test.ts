import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { pushTag } from "@/backend/actions/tag";

import { makeRepo } from "../../helpers";

let repo: string;
let bare: string;

beforeAll(() => {
  repo = makeRepo();

  bare = fs.mkdtempSync(path.join(os.tmpdir(), "ngg-test-bare-"));
  cp.execFileSync("git", ["init", "--bare", bare]);
  cp.execFileSync("git", ["remote", "add", "origin", bare], { cwd: repo });
  cp.execFileSync("git", ["push", "origin", "main"], { cwd: repo });

  cp.execFileSync("git", ["tag", "v1.0"], { cwd: repo });
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
  fs.rmSync(bare, { recursive: true, force: true });
});

const makeGit = (p: string) => simpleGit({ baseDir: p, binary: "git" });

describe("pushTag", () => {
  it("pushes an existing tag to origin", async () => {
    const result = await pushTag(makeGit(repo), { tagName: "v1.0" });
    expect(result).toEqual({ error: false });

    const tags = cp.execFileSync("git", ["tag", "-l"], { cwd: bare }).toString().trim();
    expect(tags).toBe("v1.0");
  });

  it("returns error when the tag does not exist locally", async () => {
    const result = await pushTag(makeGit(repo), { tagName: "v99.0-nonexistent" });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
