import * as cp from "node:child_process";
import * as fs from "node:fs";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { addTag } from "@/backend/actions/tag";

import { makeRepo } from "../../helpers";

let repo: string;
let commitHash: string;

beforeAll(() => {
  repo = makeRepo();
  commitHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

const makeGit = (p: string) => simpleGit({ baseDir: p, binary: "git" });

describe("addTag", () => {
  it("creates a lightweight tag at the given commit", async () => {
    const result = await addTag(makeGit(repo), {
      tagName: "v1.0-lw",
      commitHash,
      lightweight: true,
      message: ""
    });
    expect(result).toEqual({ error: false });

    const tagName = cp
      .execFileSync("git", ["tag", "-l", "v1.0-lw"], { cwd: repo })
      .toString()
      .trim();
    expect(tagName).toBe("v1.0-lw");
  });

  it("creates an annotated tag at the given commit", async () => {
    const result = await addTag(makeGit(repo), {
      tagName: "v1.0",
      commitHash,
      lightweight: false,
      message: "Release v1.0"
    });
    expect(result).toEqual({ error: false });

    const tagType = cp
      .execFileSync("git", ["cat-file", "-t", "v1.0"], { cwd: repo })
      .toString()
      .trim();
    expect(tagType).toBe("tag");
  });

  it("returns error when the tag already exists", async () => {
    const result = await addTag(makeGit(repo), {
      tagName: "v1.0-lw",
      commitHash,
      lightweight: true,
      message: ""
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });

  it("returns error when the commit hash is invalid", async () => {
    const result = await addTag(makeGit(repo), {
      tagName: "v2.0",
      commitHash: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      lightweight: true,
      message: ""
    });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
