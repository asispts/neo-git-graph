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
    git(["-c", "commit.gpgsign=false", "commit", "-m", "unmerged commit"], repo);
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
