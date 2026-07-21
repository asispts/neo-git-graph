import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { InitExtension } from "@/extension/initExtension";
import { watchForRepos } from "@/extension/watchForRepos";

import { makeRepo } from "@tests/backend/helpers";

// ─── controllable vscode mock ─────────────────────────────────────────────────
//
// vi.hoisted runs before any imports so the factory below can safely close over
// these variables when vi.mock("vscode") is evaluated.

const mock = vi.hoisted(() => {
  let folders: Array<{ uri: { fsPath: string } }> = [];
  let maxDepthVal = 0;

  let onCreateCb: (() => void) | undefined;
  let onFolderChangeCb: (() => void) | undefined;
  let onConfigChangeCb: ((e: { affectsConfiguration(k: string): boolean }) => void) | undefined;
  const commands: Record<string, () => Promise<void>> = {};
  const showErrorMessage = vi.fn();

  return {
    workspace: {
      get workspaceFolders() {
        return folders;
      },
      getConfiguration: (section: string) => ({
        get: (key: string, def: unknown) => {
          if (section === "neo-git-graph" && key === "maxDepthOfRepoSearch") return maxDepthVal;
          if (section === "git" && key === "path") return null; // falls back to "git"
          return def;
        }
      }),
      createFileSystemWatcher: () => ({
        onDidCreate: (cb: () => void) => {
          onCreateCb = cb;
          return { dispose: vi.fn() };
        },
        dispose: vi.fn()
      }),
      onDidChangeWorkspaceFolders: (cb: () => void) => {
        onFolderChangeCb = cb;
        return { dispose: vi.fn() };
      },
      onDidChangeConfiguration: (cb: (e: { affectsConfiguration(k: string): boolean }) => void) => {
        onConfigChangeCb = cb;
        return { dispose: vi.fn() };
      }
    },
    commands: {
      registerCommand: (name: string, handler: () => Promise<void>) => {
        commands[name] = handler;
        return { dispose: vi.fn() };
      }
    },
    window: { showErrorMessage },
    l10n: { t: (key: string) => key, uri: undefined },

    // ── test controls ────────────────────────────────────────────────────────
    setFolders(paths: string[]) {
      folders = paths.map((p) => ({ uri: { fsPath: p } }));
    },
    setMaxDepth(d: number) {
      maxDepthVal = d;
    },
    fireCreate() {
      onCreateCb?.();
    },
    fireFolderChange() {
      onFolderChangeCb?.();
    },
    fireConfigChange(key: string) {
      onConfigChangeCb?.({ affectsConfiguration: (k) => k === key });
    },
    async invokeCommand(name: string) {
      await commands[name]?.();
    },
    showErrorMessage
  };
});

vi.mock("vscode", () => mock);

// ─── shared fixtures ──────────────────────────────────────────────────────────

// ctx is never inspected by watchForRepos itself — it's just forwarded to onReposFound.
const ctx = {} as unknown as import("vscode").ExtensionContext;

// Allow real-fs async paths (findGitRepos) to complete.
const tick = (ms = 150) => new Promise<void>((r) => setTimeout(r, ms));

let repoDir: string;
let plainDir: string;

beforeAll(() => {
  repoDir = makeRepo();
  plainDir = fs.mkdtempSync(path.join(os.tmpdir(), "ngg-watch-plain-"));
});

afterAll(() => {
  fs.rmSync(repoDir, { recursive: true, force: true });
  fs.rmSync(plainDir, { recursive: true, force: true });
});

let watcher: ReturnType<typeof watchForRepos> | undefined;
let onReposFound: ReturnType<typeof vi.fn<InitExtension>>;

beforeEach(() => {
  vi.clearAllMocks();
  mock.setFolders([]);
  mock.setMaxDepth(0);
  onReposFound = vi.fn<InitExtension>();
  watcher = undefined;
});

afterEach(() => {
  watcher?.dispose();
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe("watchForRepos", () => {
  describe(".git creation trigger", () => {
    it("calls onReposFound with found repos", async () => {
      mock.setFolders([repoDir]);
      watcher = watchForRepos(ctx, onReposFound);

      mock.fireCreate();

      await vi.waitFor(() => expect(onReposFound).toHaveBeenCalledOnce());
      expect(onReposFound).toHaveBeenCalledWith(ctx, expect.arrayContaining([repoDir]));
    });

    it("does not call onReposFound when no repos are found", async () => {
      mock.setFolders([plainDir]);
      watcher = watchForRepos(ctx, onReposFound);

      mock.fireCreate();
      await tick();

      expect(onReposFound).not.toHaveBeenCalled();
    });
  });

  describe("workspace folders change trigger", () => {
    it("calls onReposFound with found repos", async () => {
      mock.setFolders([repoDir]);
      watcher = watchForRepos(ctx, onReposFound);

      mock.fireFolderChange();

      await vi.waitFor(() => expect(onReposFound).toHaveBeenCalledOnce());
      expect(onReposFound).toHaveBeenCalledWith(ctx, expect.arrayContaining([repoDir]));
    });
  });

  describe("config change trigger", () => {
    it("does not call onReposFound when maxDepth did not increase", () => {
      mock.setFolders([repoDir]);
      mock.setMaxDepth(0); // same as the tracker's current value → maxDepthIncreased() = false
      watcher = watchForRepos(ctx, onReposFound);

      mock.fireConfigChange("neo-git-graph.maxDepthOfRepoSearch");

      expect(onReposFound).not.toHaveBeenCalled();
    });

    it("calls onReposFound when maxDepth increases", async () => {
      mock.setFolders([repoDir]);
      watcher = watchForRepos(ctx, onReposFound); // tracker initializes at 0
      mock.setMaxDepth(5); // increase after tracker is created

      mock.fireConfigChange("neo-git-graph.maxDepthOfRepoSearch");

      await vi.waitFor(() => expect(onReposFound).toHaveBeenCalledOnce());
    });

    it("does not call onReposFound for an unrelated config key", () => {
      mock.setFolders([repoDir]);
      watcher = watchForRepos(ctx, onReposFound);

      mock.fireConfigChange("neo-git-graph.graphStyle");

      expect(onReposFound).not.toHaveBeenCalled();
    });
  });

  describe("one-shot disposal", () => {
    it("ignores further triggers after onReposFound has been called once", async () => {
      mock.setFolders([repoDir]);
      watcher = watchForRepos(ctx, onReposFound);

      mock.fireCreate();
      await vi.waitFor(() => expect(onReposFound).toHaveBeenCalledOnce());

      // State is now disposed — check() exits synchronously before any await.
      mock.fireCreate();
      await Promise.resolve();

      expect(onReposFound).toHaveBeenCalledOnce();
    });
  });

  describe("error commands (shown before any repo is found)", () => {
    it("neo-git-graph.view shows a modal error", async () => {
      watcher = watchForRepos(ctx, onReposFound);

      await mock.invokeCommand("neo-git-graph.view");

      expect(mock.showErrorMessage).toHaveBeenCalledOnce();
      expect(mock.showErrorMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ modal: true })
      );
    });

    it("neo-git-graph.clearAvatarCache shows a modal error", async () => {
      watcher = watchForRepos(ctx, onReposFound);

      await mock.invokeCommand("neo-git-graph.clearAvatarCache");

      expect(mock.showErrorMessage).toHaveBeenCalledOnce();
      expect(mock.showErrorMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ modal: true })
      );
    });
  });
});
