import * as assert from "node:assert";
import * as fs from "node:fs";

import { Config } from "@/config";
import { RepoManager } from "@/extension/repoManager";
import { RepoSearch } from "@/extension/workspaceSearch";
import { createRepoWatcher } from "@/extension/workspaceWatcher";

type StubUri = { fsPath: string };
type StubFolder = { uri: StubUri };
type FolderChangeEvent = { added: StubFolder[]; removed: StubFolder[] };

// Minimal stub for vscode.Uri — only fsPath is needed by getPathFromUri
function makeUri(fsPath: string): StubUri {
  return { fsPath };
}

// Minimal stub for vscode.WorkspaceFolder
function makeFolder(fsPath: string): StubFolder {
  return { uri: makeUri(fsPath) };
}

const tick = () => new Promise<void>((r) => setTimeout(r, 10));

function makeStubs(initialFolders: string[] = []) {
  const searched: string[] = [];
  const removed: string[] = [];
  let sendCount = 0;

  const repoSearch = {
    searchDirectoryForRepos: async (path: string, _depth: number) => {
      searched.push(path);
      return true;
    }
  };

  const repoManager = {
    removeReposWithinFolder: (path: string) => {
      removed.push(path);
      return true;
    },
    sendRepos: () => {
      sendCount++;
    }
  };

  const config = { maxDepthOfRepoSearch: () => 2 };

  // Capture watcher handles and folder-change handler so tests can fire events
  type WatcherHandle = {
    pattern: string;
    fireCreate: (uri: StubUri) => void;
    fireChange: (uri: StubUri) => void;
    fireDelete: (uri: StubUri) => void;
    disposed: boolean;
  };
  const watcherHandles: WatcherHandle[] = [];
  let folderChangeCallback: ((e: FolderChangeEvent) => void) | null = null;

  const workspace = {
    workspaceFolders: initialFolders.map(makeFolder),
    createFileSystemWatcher(pattern: string) {
      const handle: WatcherHandle = {
        pattern,
        fireCreate: () => {},
        fireChange: () => {},
        fireDelete: () => {},
        disposed: false
      };
      watcherHandles.push(handle);
      return {
        onDidCreate: (h: (uri: StubUri) => void) => {
          handle.fireCreate = h;
          return { dispose: () => {} };
        },
        onDidChange: (h: (uri: StubUri) => void) => {
          handle.fireChange = h;
          return { dispose: () => {} };
        },
        onDidDelete: (h: (uri: StubUri) => void) => {
          handle.fireDelete = h;
          return { dispose: () => {} };
        },
        dispose: () => {
          handle.disposed = true;
        }
      };
    },
    onDidChangeWorkspaceFolders(h: (e: FolderChangeEvent) => void) {
      folderChangeCallback = h;
      return { dispose: () => {} };
    }
  };

  const watcher = createRepoWatcher(
    repoManager as unknown as RepoManager,
    config as unknown as Config,
    repoSearch as unknown as RepoSearch,
    workspace as unknown as Parameters<typeof createRepoWatcher>[3],
    0 // debounceDelay=0 so timers fire after a single tick
  );

  const fireFolderChange = (e: FolderChangeEvent) => folderChangeCallback!(e);

  return {
    watcher,
    watcherHandles,
    fireFolderChange,
    tick,
    searched,
    removed,
    getSendCount: () => sendCount
  };
}

suite("workspaceWatcher / startWatching", () => {
  test("creates a file watcher for each existing workspace folder", () => {
    const { watcher, watcherHandles } = makeStubs(["/ws/a", "/ws/b"]);
    watcher.startWatching();
    assert.strictEqual(watcherHandles.length, 2);
    assert.ok(watcherHandles.some((h) => h.pattern === "/ws/a/**"));
    assert.ok(watcherHandles.some((h) => h.pattern === "/ws/b/**"));
    watcher.dispose();
  });

  test("does nothing when there are no workspace folders", () => {
    const { watcher, watcherHandles } = makeStubs([]);
    watcher.startWatching();
    assert.strictEqual(watcherHandles.length, 0);
    watcher.dispose();
  });
});

suite("workspaceWatcher / dispose", () => {
  test("disposes all active file watchers", () => {
    const { watcher, watcherHandles } = makeStubs(["/ws/a", "/ws/b"]);
    watcher.startWatching();
    watcher.dispose();
    assert.ok(watcherHandles.every((h) => h.disposed));
  });
});

suite("workspaceWatcher / onWatcherDelete", () => {
  test("calls removeReposWithinFolder and sendRepos on delete", () => {
    const { watcher, watcherHandles, removed, getSendCount } = makeStubs(["/ws/a"]);
    watcher.startWatching();
    watcherHandles[0].fireDelete(makeUri("/ws/a/subdir"));
    assert.deepStrictEqual(removed, ["/ws/a/subdir"]);
    assert.strictEqual(getSendCount(), 1);
    watcher.dispose();
  });

  test("ignores paths inside .git/", () => {
    const { watcher, watcherHandles, removed } = makeStubs(["/ws/a"]);
    watcher.startWatching();
    watcherHandles[0].fireDelete(makeUri("/ws/a/.git/refs"));
    assert.deepStrictEqual(removed, []);
    watcher.dispose();
  });

  test("strips /.git suffix before calling removeReposWithinFolder", () => {
    const { watcher, watcherHandles, removed } = makeStubs(["/ws/a"]);
    watcher.startWatching();
    watcherHandles[0].fireDelete(makeUri("/ws/a/project/.git"));
    assert.deepStrictEqual(removed, ["/ws/a/project"]);
    watcher.dispose();
  });
});

suite("workspaceWatcher / onWatcherCreate (debounced)", () => {
  test("triggers searchDirectoryForRepos for a new directory", async () => {
    const tmp = fs.mkdtempSync("/tmp/ngg-watcher-test-");
    try {
      const { watcher, watcherHandles, searched } = makeStubs(["/ws/a"]);
      watcher.startWatching();
      watcherHandles[0].fireCreate(makeUri(tmp));
      await new Promise<void>((r) => setTimeout(r, 10));
      assert.ok(searched.includes(tmp));
      watcher.dispose();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("deduplicates paths fired in the same debounce window", async () => {
    const tmp = fs.mkdtempSync("/tmp/ngg-watcher-test-");
    try {
      const { watcher, watcherHandles, searched } = makeStubs(["/ws/a"]);
      watcher.startWatching();
      watcherHandles[0].fireCreate(makeUri(tmp));
      watcherHandles[0].fireCreate(makeUri(tmp));
      watcherHandles[0].fireCreate(makeUri(tmp));
      // Use a longer timeout: the 0ms debounce fires, then processCreateEvents suspends
      // on await isDirectory() (real fs.stat I/O), which can be slow on loaded CI runners.
      await new Promise<void>((r) => setTimeout(r, 500));
      assert.strictEqual(
        searched.filter((p) => p === tmp).length,
        1,
        "same path should only be searched once"
      );
      watcher.dispose();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("ignores paths inside .git/", async () => {
    const { watcher, watcherHandles, searched } = makeStubs(["/ws/a"]);
    watcher.startWatching();
    watcherHandles[0].fireCreate(makeUri("/ws/a/.git/objects"));
    await new Promise<void>((r) => setTimeout(r, 10));
    assert.deepStrictEqual(searched, []);
    watcher.dispose();
  });

  test("strips /.git suffix before searching", async () => {
    const tmp = fs.mkdtempSync("/tmp/ngg-watcher-test-");
    try {
      const { watcher, watcherHandles, searched } = makeStubs(["/ws/a"]);
      watcher.startWatching();
      watcherHandles[0].fireCreate(makeUri(tmp + "/.git"));
      await new Promise<void>((r) => setTimeout(r, 10));
      assert.ok(searched.includes(tmp));
      watcher.dispose();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

suite("workspaceWatcher / onWatcherChange (debounced)", () => {
  test("ignores paths inside .git/", async () => {
    const { watcher, watcherHandles, removed } = makeStubs(["/ws/a"]);
    watcher.startWatching();
    watcherHandles[0].fireChange(makeUri("/ws/a/.git/config"));
    await new Promise<void>((r) => setTimeout(r, 10));
    assert.deepStrictEqual(removed, []);
    watcher.dispose();
  });

  test("deduplicates paths fired in the same debounce window", async () => {
    // Fire a change for a path that does not exist so removeReposWithinFolder is called
    const { watcher, watcherHandles, removed } = makeStubs(["/ws/a"]);
    watcher.startWatching();
    watcherHandles[0].fireChange(makeUri("/tmp/ngg-does-not-exist-xyz"));
    watcherHandles[0].fireChange(makeUri("/tmp/ngg-does-not-exist-xyz"));
    await new Promise<void>((r) => setTimeout(r, 10));
    assert.strictEqual(
      removed.filter((p) => p === "/tmp/ngg-does-not-exist-xyz").length,
      1,
      "same path should only be processed once"
    );
    watcher.dispose();
  });
});

suite("workspaceWatcher / workspace folder changes", () => {
  test("adding a folder triggers repo search and starts a watcher", async () => {
    const { watcher, watcherHandles, fireFolderChange, searched } = makeStubs([]);
    watcher.startWatching();
    fireFolderChange({ added: [makeFolder("/ws/new")], removed: [] });
    await new Promise<void>((r) => setTimeout(r, 10));
    assert.ok(searched.includes("/ws/new"));
    assert.ok(watcherHandles.some((h) => h.pattern === "/ws/new/**"));
    watcher.dispose();
  });

  test("adding a folder that has repos calls sendRepos", async () => {
    const { watcher, fireFolderChange, getSendCount } = makeStubs([]);
    watcher.startWatching();
    fireFolderChange({ added: [makeFolder("/ws/new")], removed: [] });
    await new Promise<void>((r) => setTimeout(r, 10));
    assert.strictEqual(getSendCount(), 1);
    watcher.dispose();
  });

  test("removing a folder removes repos and disposes its watcher", async () => {
    const { watcher, watcherHandles, fireFolderChange, removed } = makeStubs(["/ws/a"]);
    watcher.startWatching();
    fireFolderChange({ added: [], removed: [makeFolder("/ws/a")] });
    await new Promise<void>((r) => setTimeout(r, 10));
    assert.ok(removed.includes("/ws/a"));
    assert.ok(watcherHandles[0].disposed);
    watcher.dispose();
  });

  test("removing a folder with repos calls sendRepos", async () => {
    const { watcher, fireFolderChange, getSendCount } = makeStubs(["/ws/a"]);
    watcher.startWatching();
    fireFolderChange({ added: [], removed: [makeFolder("/ws/a")] });
    await new Promise<void>((r) => setTimeout(r, 10));
    assert.strictEqual(getSendCount(), 1);
    watcher.dispose();
  });
});
