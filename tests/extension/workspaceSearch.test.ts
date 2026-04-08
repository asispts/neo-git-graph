import * as assert from "node:assert";
import * as fs from "node:fs";

import { Config } from "../../src/config";
import { RepoManager } from "../../src/extension/repoManager";
import { createRepoSearch } from "../../src/extension/workspaceSearch";
import { makeRepo } from "../backend/helpers";

function makeStubs(initialRepoPaths: string[] = [], maxDepth = 2, gitPath = "git") {
  const repos: Record<string, { columnWidths: null }> = {};
  for (const r of initialRepoPaths) repos[r] = { columnWidths: null };

  const added: string[] = [];
  let sendCount = 0;

  const repoManager = {
    getRepos: () => ({ ...repos }),
    addRepo: (path: string) => {
      repos[path] = { columnWidths: null };
      added.push(path);
    },
    sendRepos: () => {
      sendCount++;
    }
  };

  let currentMaxDepth = maxDepth;
  const config = {
    maxDepthOfRepoSearch: () => currentMaxDepth,
    gitPath: () => gitPath
  };

  const repoSearch = createRepoSearch(
    repoManager as unknown as RepoManager,
    config as unknown as Config
  );

  return {
    repoSearch,
    added,
    getSendCount: () => sendCount,
    setMaxDepth: (d: number) => {
      currentMaxDepth = d;
    }
  };
}

suite("workspaceSearch / searchDirectoryForRepos", () => {
  let repo: string;

  setup(() => {
    repo = makeRepo();
  });

  teardown(() => {
    if (fs.existsSync(repo)) fs.rmSync(repo, { recursive: true, force: true });
  });

  test("returns true and adds repo when a git repo is found", async () => {
    const { repoSearch, added } = makeStubs();
    const found = await repoSearch.searchDirectoryForRepos(repo, 0);
    assert.strictEqual(found, true);
    assert.deepStrictEqual(added, [repo]);
  });

  test("returns false for a non-repo directory", async () => {
    const { repoSearch, added } = makeStubs();
    const dir = fs.mkdtempSync(repo + "-plain-");
    try {
      const found = await repoSearch.searchDirectoryForRepos(dir, 0);
      assert.strictEqual(found, false);
      assert.deepStrictEqual(added, []);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("returns false for a non-existent directory", async () => {
    const { repoSearch, added } = makeStubs();
    const found = await repoSearch.searchDirectoryForRepos("/tmp/ngg-does-not-exist-xyz", 0);
    assert.strictEqual(found, false);
    assert.deepStrictEqual(added, []);
  });

  test("skips repos already in repoManager", async () => {
    const { repoSearch, added } = makeStubs([repo]);
    const found = await repoSearch.searchDirectoryForRepos(repo, 0);
    assert.strictEqual(found, false);
    assert.deepStrictEqual(added, []);
  });

  test("finds repo nested at depth 1", async () => {
    const parent = fs.mkdtempSync(repo + "-parent-");
    const nested = parent + "/nested-repo";
    fs.mkdirSync(nested);
    // copy repo into nested
    fs.cpSync(repo, nested, { recursive: true });
    try {
      const { repoSearch, added } = makeStubs();
      const found = await repoSearch.searchDirectoryForRepos(parent, 1);
      assert.strictEqual(found, true);
      assert.ok(added.some((p) => p.startsWith(parent)));
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
    }
  });

  test("does not find repos beyond maxDepth", async () => {
    const parent = fs.mkdtempSync(repo + "-deep-");
    const level1 = parent + "/level1";
    const level2 = level1 + "/level2";
    fs.mkdirSync(level2, { recursive: true });
    fs.cpSync(repo, level2 + "/repo", { recursive: true });
    try {
      const { repoSearch, added } = makeStubs();
      const found = await repoSearch.searchDirectoryForRepos(parent, 1);
      assert.strictEqual(found, false);
      assert.deepStrictEqual(added, []);
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
    }
  });
});

suite("workspaceSearch / maxDepthChanged", () => {
  test("does not trigger workspace search when depth stays the same", () => {
    const { repoSearch, getSendCount, setMaxDepth } = makeStubs([], 2);
    setMaxDepth(2);
    repoSearch.maxDepthChanged();
    assert.strictEqual(getSendCount(), 0);
  });

  test("does not trigger workspace search when depth decreases", () => {
    const { repoSearch, getSendCount, setMaxDepth } = makeStubs([], 3);
    setMaxDepth(1);
    repoSearch.maxDepthChanged();
    assert.strictEqual(getSendCount(), 0);
  });

  test("after depth increase, same depth again does not re-trigger search", async () => {
    const { repoSearch, getSendCount, setMaxDepth } = makeStubs([], 2);
    setMaxDepth(5);
    repoSearch.maxDepthChanged(); // increases — may trigger workspace search depending on folders
    const countAfterIncrease = getSendCount();
    setMaxDepth(5); // same value, no increase
    repoSearch.maxDepthChanged();
    assert.strictEqual(getSendCount(), countAfterIncrease);
  });
});
