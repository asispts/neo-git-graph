import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: () => ({
      get: (_key: string, defaultValue: unknown) => defaultValue
    })
  }
}));

import { DataSource } from "../../src/dataSource";

function git(args: string[], cwd: string) {
  cp.execFileSync("git", args, { cwd, stdio: "pipe" });
}

function makeRepo(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
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

let parentRepo: string;
let submoduleRepo: string;
let standaloneRepo: string;

beforeAll(() => {
  submoduleRepo = makeRepo("ngg-submodule-");
  parentRepo = makeRepo("ngg-parent-");
  standaloneRepo = makeRepo("ngg-plain-");

  git(
    [
      "-c",
      "protocol.file.allow=always",
      "submodule",
      "add",
      submoduleRepo,
      "modules/child"
    ],
    parentRepo
  );
  git(["-c", "commit.gpgsign=false", "commit", "-am", "add submodule"], parentRepo);
});

afterAll(() => {
  fs.rmSync(parentRepo, { recursive: true, force: true });
  fs.rmSync(submoduleRepo, { recursive: true, force: true });
  fs.rmSync(standaloneRepo, { recursive: true, force: true });
});

describe("getSubmodules", () => {
  it("returns initialized submodules declared in .gitmodules", async () => {
    const dataSource = new DataSource();

    const submodules = await dataSource.getSubmodules(parentRepo);

    expect(submodules).toEqual([path.join(parentRepo, "modules/child").replace(/\\/g, "/")]);
  });

  it("returns an empty array when a repository has no .gitmodules file", async () => {
    const dataSource = new DataSource();

    await expect(dataSource.getSubmodules(standaloneRepo)).resolves.toEqual([]);
  });
});