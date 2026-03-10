import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { getBranches } from "../../src/features/branch";

const REPO = path.resolve(__dirname, "../.."); // the project root is a git repo

describe("getBranches", () => {
  it("returns branches and head for a valid repo", async () => {
    const result = await getBranches(REPO, "git", false);
    expect(result.error).toBe(false);
    expect(result.branches.length).toBeGreaterThan(0);
    expect(result.head).not.toBeNull();
  });

  it("returns error:true for a non-git directory", async () => {
    const result = await getBranches("/tmp", "git", false);
    expect(result.error).toBe(true);
    expect(result.branches).toEqual([]);
    expect(result.head).toBeNull();
  });
});
