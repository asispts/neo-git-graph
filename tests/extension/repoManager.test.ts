import * as assert from "node:assert";
import * as fs from "node:fs";

import { Config } from "@/config";
import { createRepoManager } from "@/extension/repoManager";
import { ExtensionState } from "@/extensionState";
import { StatusBarItem } from "@/statusBarItem";
import { GitRepoSet } from "@/types";

import { makeRepo } from "@tests/backend/helpers";

function makeManager(initialRepos: GitRepoSet = {}) {
  const store = { repos: { ...initialRepos } };
  let saveCount = 0;
  const extensionState = {
    getRepos: () => store.repos,
    saveRepos: (r: GitRepoSet) => {
      store.repos = r;
      saveCount++;
    }
  };
  const statusBar = {
    lastCount: -1,
    setNumRepos(n: number) {
      this.lastCount = n;
    }
  };
  const config = { gitPath: () => "git" };
  const manager = createRepoManager(
    extensionState as unknown as ExtensionState,
    statusBar as unknown as StatusBarItem,
    config as unknown as Config
  );
  return { manager, store, statusBar, getSaveCount: () => saveCount };
}

suite("repoManager", () => {
  suite("addRepo", () => {
    test("adds a repo with null columnWidths", () => {
      const { manager, store } = makeManager();
      manager.addRepo("/ws/a");
      assert.deepStrictEqual(store.repos["/ws/a"], { columnWidths: null });
    });

    test("persists after adding", () => {
      const { manager, getSaveCount } = makeManager();
      manager.addRepo("/ws/a");
      assert.strictEqual(getSaveCount(), 1);
    });
  });

  suite("removeRepo", () => {
    test("removes an existing repo", () => {
      const { manager, store } = makeManager({ "/ws/a": { columnWidths: null } });
      manager.removeRepo("/ws/a");
      assert.strictEqual(store.repos["/ws/a"], undefined);
    });

    test("persists after removing", () => {
      const { manager, getSaveCount } = makeManager({ "/ws/a": { columnWidths: null } });
      manager.removeRepo("/ws/a");
      assert.strictEqual(getSaveCount(), 1);
    });
  });

  suite("setRepoState", () => {
    test("updates the state of an existing repo", () => {
      const { manager, store } = makeManager({ "/ws/a": { columnWidths: null } });
      manager.setRepoState("/ws/a", { columnWidths: [100, 200] });
      assert.deepStrictEqual(store.repos["/ws/a"], { columnWidths: [100, 200] });
    });

    test("persists after updating state", () => {
      const { manager, getSaveCount } = makeManager({ "/ws/a": { columnWidths: null } });
      manager.setRepoState("/ws/a", { columnWidths: [1] });
      assert.strictEqual(getSaveCount(), 1);
    });
  });

  suite("getRepos", () => {
    test("returns repos sorted by path", () => {
      const { manager } = makeManager({
        "/z": { columnWidths: null },
        "/a": { columnWidths: null },
        "/m": { columnWidths: null }
      });
      assert.deepStrictEqual(Object.keys(manager.getRepos()), ["/a", "/m", "/z"]);
    });
  });

  suite("isDirectoryWithinRepos", () => {
    const initial = {
      "/ws/project": { columnWidths: null },
      "/ws/other": { columnWidths: null }
    };

    test("returns true for an exact repo path", () => {
      const { manager } = makeManager(initial);
      assert.strictEqual(manager.isDirectoryWithinRepos("/ws/project"), true);
    });

    test("returns true for a subdirectory of a repo", () => {
      const { manager } = makeManager(initial);
      assert.strictEqual(manager.isDirectoryWithinRepos("/ws/project/src"), true);
    });

    test("returns false for an unrelated path", () => {
      const { manager } = makeManager(initial);
      assert.strictEqual(manager.isDirectoryWithinRepos("/ws/unrelated"), false);
    });

    test("returns false for a sibling with a shared prefix", () => {
      const { manager } = makeManager(initial);
      assert.strictEqual(manager.isDirectoryWithinRepos("/ws/projectother"), false);
    });
  });

  suite("removeReposWithinFolder", () => {
    test("removes repos at the exact folder path and returns true", () => {
      const { manager, store } = makeManager({
        "/ws/proj": { columnWidths: null },
        "/ws/other": { columnWidths: null }
      });
      const changed = manager.removeReposWithinFolder("/ws/proj");
      assert.strictEqual(changed, true);
      assert.deepStrictEqual(Object.keys(store.repos), ["/ws/other"]);
    });

    test("removes repos nested within the folder", () => {
      const { manager, store } = makeManager({
        "/ws/proj/sub": { columnWidths: null },
        "/ws/other": { columnWidths: null }
      });
      manager.removeReposWithinFolder("/ws/proj");
      assert.deepStrictEqual(Object.keys(store.repos), ["/ws/other"]);
    });

    test("returns false when no repos are removed", () => {
      const { manager } = makeManager({ "/ws/other": { columnWidths: null } });
      assert.strictEqual(manager.removeReposWithinFolder("/ws/proj"), false);
    });

    test("does not remove repos with a shared path prefix", () => {
      const { manager, store } = makeManager({
        "/ws/proj": { columnWidths: null },
        "/ws/projectx": { columnWidths: null }
      });
      manager.removeReposWithinFolder("/ws/proj");
      assert.deepStrictEqual(Object.keys(store.repos), ["/ws/projectx"]);
    });
  });

  suite("sendRepos / registerViewCallback", () => {
    test("calls the view callback with sorted repos and count", () => {
      const { manager } = makeManager({
        "/z": { columnWidths: null },
        "/a": { columnWidths: null }
      });
      let cbRepos: GitRepoSet | null = null;
      let cbCount = -1;
      manager.registerViewCallback((r, n) => {
        cbRepos = r;
        cbCount = n;
      });
      manager.sendRepos();
      assert.deepStrictEqual(Object.keys(cbRepos!), ["/a", "/z"]);
      assert.strictEqual(cbCount, 2);
    });

    test("does not call the callback after deregistering", () => {
      const { manager } = makeManager({ "/a": { columnWidths: null } });
      let called = false;
      manager.registerViewCallback(() => {
        called = true;
      });
      manager.deregisterViewCallback();
      manager.sendRepos();
      assert.strictEqual(called, false);
    });

    test("updates statusBar with repo count", () => {
      const { manager, statusBar } = makeManager({
        "/a": { columnWidths: null },
        "/b": { columnWidths: null }
      });
      manager.sendRepos();
      assert.strictEqual(statusBar.lastCount, 2);
    });
  });

  suite("checkReposExist", () => {
    let repo: string;

    setup(() => {
      repo = makeRepo();
    });

    teardown(() => {
      if (fs.existsSync(repo)) fs.rmSync(repo, { recursive: true, force: true });
    });

    test("returns false and keeps repos when all repos still exist", async () => {
      const { manager, store } = makeManager({ [repo]: { columnWidths: null } });
      const changed = await manager.checkReposExist();
      assert.strictEqual(changed, false);
      assert.ok(Object.keys(store.repos).includes(repo));
    });

    test("returns true and removes repos that no longer exist", async () => {
      fs.rmSync(repo, { recursive: true, force: true });
      const { manager, store } = makeManager({ [repo]: { columnWidths: null } });
      const changed = await manager.checkReposExist();
      assert.strictEqual(changed, true);
      assert.ok(!Object.keys(store.repos).includes(repo));
    });

    test("calls sendRepos when repos are removed", async () => {
      fs.rmSync(repo, { recursive: true, force: true });
      const { manager, statusBar } = makeManager({ [repo]: { columnWidths: null } });
      await manager.checkReposExist();
      assert.ok(statusBar.lastCount >= 0);
    });
  });
});
