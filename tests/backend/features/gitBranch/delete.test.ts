import * as fs from "node:fs";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitBranchFactory } from "@/backend/features/gitBranch";
import { gitClientFactory } from "@/backend/features/gitClient";

import { git, makeRepo } from "../helpers";

let repo: string;

beforeAll(() => {
  repo = makeRepo();
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("delete", () => {
  it("deletes an existing branch", async () => {
    git(["branch", "to-delete"], repo);
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.delete("to-delete", false);
    expect(result.error).toBe(false);

    const listResult = await branch.list(false);
    expect(listResult.branches).not.toContain("to-delete");
  });

  it("returns error:true when deleting a branch with unmerged changes without force", async () => {
    git(["checkout", "-b", "unmerged"], repo);
    fs.writeFileSync(path.join(repo, "g"), "y");
    git(["add", "."], repo);
    git(["commit", "-m", "unmerged commit"], repo);
    git(["checkout", "main"], repo);

    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.delete("unmerged", false);
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("force-deletes a branch with unmerged changes", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.delete("unmerged", true);
    expect(result.error).toBe(false);

    const listResult = await branch.list(false);
    expect(listResult.branches).not.toContain("unmerged");
  });

  it("returns error:true when the branch does not exist", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.delete("nonexistent", false);
    expect(result.error).toBe(true);
  });
});
