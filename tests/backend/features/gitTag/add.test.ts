import * as cp from "node:child_process";
import * as fs from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "@/backend/features/gitClient";
import { gitTagFactory } from "@/backend/features/gitTag";

import { makeRepo } from "../helpers";

let repo: string;
let commitHash: string;

beforeAll(() => {
  repo = makeRepo();
  commitHash = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("add", () => {
  it("creates a lightweight tag at the given commit", async () => {
    const client = gitClientFactory(repo, "git");
    const tag = gitTagFactory(client.getInstance);

    const result = await tag.add("v1.0-lw", commitHash, true, "");
    expect(result.error).toBe(false);

    const tagName = cp
      .execFileSync("git", ["tag", "-l", "v1.0-lw"], { cwd: repo })
      .toString()
      .trim();
    expect(tagName).toBe("v1.0-lw");
  });

  it("creates an annotated tag at the given commit", async () => {
    const client = gitClientFactory(repo, "git");
    const tag = gitTagFactory(client.getInstance);

    const result = await tag.add("v1.0", commitHash, false, "Release v1.0");
    expect(result.error).toBe(false);

    const tagType = cp
      .execFileSync("git", ["cat-file", "-t", "v1.0"], { cwd: repo })
      .toString()
      .trim();
    expect(tagType).toBe("tag");
  });

  it("returns error:true when the tag already exists", async () => {
    const client = gitClientFactory(repo, "git");
    const tag = gitTagFactory(client.getInstance);

    const result = await tag.add("v1.0-lw", commitHash, true, "");
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("returns error:true when the commit hash is invalid", async () => {
    const client = gitClientFactory(repo, "git");
    const tag = gitTagFactory(client.getInstance);

    const result = await tag.add("v2.0", "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef", true, "");
    expect(result.error).toBe(true);
  });
});
