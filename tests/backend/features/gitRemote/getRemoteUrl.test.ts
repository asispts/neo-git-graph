import * as fs from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gitRemoteFactory } from "@/backend/features/gitRemote";

import { git, makeRepo } from "../helpers";

let repoWithRemote: string;
let repoWithoutRemote: string;

beforeAll(() => {
  repoWithRemote = makeRepo();
  git(["remote", "add", "origin", "https://github.com/some/repo.git"], repoWithRemote);

  repoWithoutRemote = makeRepo();
});

afterAll(() => {
  fs.rmSync(repoWithRemote, { recursive: true, force: true });
  fs.rmSync(repoWithoutRemote, { recursive: true, force: true });
});

describe("getRemoteUrl", () => {
  it("returns the remote origin URL", async () => {
    const gitRemote = gitRemoteFactory("git");
    expect(await gitRemote.getRemoteUrl(repoWithRemote)).toBe("https://github.com/some/repo.git");
  });

  it("returns null when there is no remote", async () => {
    const gitRemote = gitRemoteFactory("git");
    expect(await gitRemote.getRemoteUrl(repoWithoutRemote)).toBeNull();
  });

  it("returns null for a non-existent path", async () => {
    const gitRemote = gitRemoteFactory("git");
    expect(await gitRemote.getRemoteUrl("/tmp/ngg-test-does-not-exist-xyz")).toBeNull();
  });
});
