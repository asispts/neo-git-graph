import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitBranchFactory } from "../../../../src/backend/features/gitBranch";
import { gitClientFactory } from "../../../../src/backend/features/gitClient";

function git(args: string[], cwd: string) {
  cp.execFileSync("git", args, { cwd, stdio: "pipe" });
}

function currentBranch(cwd: string): string {
  return cp.execFileSync("git", ["branch", "--show-current"], { cwd }).toString().trim();
}

function makeRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ngg-test-"));
  try {
    git(["init", "-b", "main"], dir);
  } catch {
    git(["init"], dir);
    git(["checkout", "-b", "main"], dir);
  }
  git(["config", "user.email", "t@t.com"], dir);
  git(["config", "user.name", "T"], dir);
  fs.writeFileSync(path.join(dir, "f"), "x");
  git(["add", "."], dir);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "init"], dir);
  return dir;
}

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

    // clean up
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
