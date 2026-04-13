import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { simpleGit } from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { pushTag } from "@/backend/actions/tag";

import { makeRepo } from "@tests/backend/helpers";

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

describe("pushTag", () => {
  it("pushes an existing tag to origin", async () => {
    await pushTag(simpleGit(repo), { tagName: "v1.0" });

    const tags = cp.execFileSync("git", ["tag", "-l"], { cwd: bare }).toString().trim();
    expect(tags).toBe("v1.0");
  });

  it("throws when the tag does not exist locally", async () => {
    await expect(pushTag(simpleGit(repo), { tagName: "v99.0-nonexistent" })).rejects.toThrow();
  });
});
