import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitClientFactory } from "@/backend/features/gitClient";
import { gitTagFactory } from "@/backend/features/gitTag";

import { makeRepo } from "../helpers";

let repo: string;
let bare: string;

beforeAll(() => {
  repo = makeRepo();

  // Create a local bare repo to act as the remote — no network required
  bare = fs.mkdtempSync(path.join(os.tmpdir(), "ngg-test-bare-"));
  cp.execFileSync("git", ["init", "--bare", bare]);
  cp.execFileSync("git", ["remote", "add", "origin", bare], { cwd: repo });
  cp.execFileSync("git", ["push", "origin", "main"], { cwd: repo });

  // Create a local tag to push
  cp.execFileSync("git", ["tag", "v1.0"], { cwd: repo });
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
  fs.rmSync(bare, { recursive: true, force: true });
});

describe("push", () => {
  it("pushes an existing tag to origin", async () => {
    const client = gitClientFactory(repo, "git");
    const tag = gitTagFactory(client.getInstance);

    const result = await tag.push("v1.0");
    expect(result.error).toBe(false);

    const tags = cp.execFileSync("git", ["tag", "-l"], { cwd: bare }).toString().trim();
    expect(tags).toBe("v1.0");
  });

  it("returns error:true when the tag does not exist locally", async () => {
    const client = gitClientFactory(repo, "git");
    const tag = gitTagFactory(client.getInstance);

    const result = await tag.push("v99.0-nonexistent");
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
