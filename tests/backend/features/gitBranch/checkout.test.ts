import * as fs from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitBranchFactory } from "@/backend/features/gitBranch";
import { gitClientFactory } from "@/backend/features/gitClient";

import { currentBranch, git, makeRepo } from "../helpers";

let repo: string;

beforeAll(() => {
  repo = makeRepo();
  git(["branch", "other"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("checkout", () => {
  it("checks out an existing local branch", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.checkout("other", null);
    expect(result.error).toBe(false);
    expect(currentBranch(repo)).toBe("other");
  });

  it("checks back out to main", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.checkout("main", null);
    expect(result.error).toBe(false);
    expect(currentBranch(repo)).toBe("main");
  });

  it("creates and checks out a new branch from a start point", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.checkout("from-main", "main");
    expect(result.error).toBe(false);
    expect(currentBranch(repo)).toBe("from-main");

    await branch.checkout("main", null);
    await branch.delete("from-main", false);
  });

  it("returns error:true when checking out a nonexistent branch", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.checkout("nonexistent", null);
    expect(result.error).toBe(true);
    if (result.error) {
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("returns error:true when the new branch name already exists", async () => {
    const client = gitClientFactory(repo, "git");
    const branch = gitBranchFactory(client.getInstance);

    const result = await branch.checkout("other", "main");
    expect(result.error).toBe(true);
  });
});
