import * as fs from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitBranchFactory } from "@/backend/features/gitBranch";
import { gitClientFactory } from "@/backend/features/gitClient";

import { git, makeRepo } from "../helpers";

let repo: string;

beforeAll(() => {
  repo = makeRepo();
  git(["branch", "old-name"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("rename", () => {
  it("renames an existing branch", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.rename("old-name", "new-name");
    expect(result.error).toBe(false);

    const listResult = await branch.list(false);
    expect(listResult.branches).toContain("new-name");
    expect(listResult.branches).not.toContain("old-name");
  });

  it("returns error:true when the source branch does not exist", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.rename("nonexistent-branch", "whatever");
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("returns error:true when the target branch already exists", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.rename("new-name", "main");
    expect(result.error).toBe(true);
  });
});
