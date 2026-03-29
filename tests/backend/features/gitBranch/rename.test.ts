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

    // "main" already exists; trying to rename "new-name" to "main" should fail
    const result = await branch.rename("new-name", "main");
    expect(result.error).toBe(true);
  });
});
