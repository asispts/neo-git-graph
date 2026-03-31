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

describe("delete", () => {
  it("deletes an existing tag", async () => {
    cp.execFileSync("git", ["tag", "v1.0", commitHash], { cwd: repo });
    const client = gitClientFactory(repo, "git");
    const tag = gitTagFactory(client.getInstance);

    const result = await tag.delete("v1.0");
    expect(result.error).toBe(false);

    const tags = cp.execFileSync("git", ["tag"], { cwd: repo }).toString().trim();
    expect(tags).not.toContain("v1.0");
  });

  it("returns error:true when the tag does not exist", async () => {
    const client = gitClientFactory(repo, "git");
    const tag = gitTagFactory(client.getInstance);

    const result = await tag.delete("nonexistent");
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
