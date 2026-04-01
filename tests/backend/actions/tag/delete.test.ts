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

    await deleteTag(simpleGit(repo), { tagName: "v1.0" });

    const tags = cp.execFileSync("git", ["tag"], { cwd: repo }).toString().trim();
    expect(tags).not.toContain("v1.0");
  });

  it("throws when the tag does not exist", async () => {
    await expect(deleteTag(simpleGit(repo), { tagName: "nonexistent" })).rejects.toThrow();
  });
});
