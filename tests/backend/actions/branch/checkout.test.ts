import * as cp from "node:child_process";
import * as fs from "node:fs";

import { simpleGit } from "simple-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { checkoutBranch } from "@/backend/actions/branch";

import { git, makeRepo } from "@tests/backend/helpers";

let repo: string;

function currentBranch(cwd: string): string {
  return cp.execFileSync("git", ["branch", "--show-current"], { cwd }).toString().trim();
}

beforeAll(() => {
  repo = makeRepo();
  git(["branch", "other"], repo);
});

afterAll(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

describe("checkoutBranch", () => {
  it("checks out an existing local branch", async () => {
    await checkoutBranch(simpleGit(repo), {
      branchName: "other",
      remoteBranch: null
    });
    expect(currentBranch(repo)).toBe("other");
  });

  it("checks back out to main", async () => {
    await checkoutBranch(simpleGit(repo), {
      branchName: "main",
      remoteBranch: null
    });
    expect(currentBranch(repo)).toBe("main");
  });

  it("creates and checks out a new branch from a start point", async () => {
    await checkoutBranch(simpleGit(repo), {
      branchName: "from-main",
      remoteBranch: "main"
    });
    expect(currentBranch(repo)).toBe("from-main");

    git(["checkout", "main"], repo);
    git(["branch", "-d", "from-main"], repo);
  });

  it("throws when checking out a nonexistent branch", async () => {
    await expect(
      checkoutBranch(simpleGit(repo), {
        branchName: "nonexistent",
        remoteBranch: null
      })
    ).rejects.toThrow();
  });

  it("throws when the new branch name already exists", async () => {
    await expect(
      checkoutBranch(simpleGit(repo), {
        branchName: "other",
        remoteBranch: "main"
      })
    ).rejects.toThrow();
  });
});
