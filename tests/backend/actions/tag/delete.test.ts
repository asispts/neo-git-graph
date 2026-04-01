import * as cp from "node:child_process";
import * as fs from "node:fs";

import simpleGit from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deleteTag } from "@/backend/actions/tag";

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

describe("deleteTag", () => {
  it("deletes an existing tag", async () => {
    cp.execFileSync("git", ["tag", "v1.0", commitHash], { cwd: repo });

    const result = await deleteTag(simpleGit(repo), { tagName: "v1.0" });
    expect(result).toEqual({ error: false });

    const tags = cp.execFileSync("git", ["tag"], { cwd: repo }).toString().trim();
    expect(tags).not.toContain("v1.0");
  });

  it("returns error when the tag does not exist", async () => {
    const result = await deleteTag(simpleGit(repo), { tagName: "nonexistent" });
    expect(result).toEqual({ error: true, message: expect.any(String) });
  });
});
