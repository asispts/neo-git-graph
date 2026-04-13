import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";

vi.mock("@/extension/initExtension");

import { initExtension } from "@/extension/initExtension";
import { watchForRepos } from "@/extension/watchForRepos";
import type { WorkspaceApi } from "@/extension/watchForRepos";

function makeFakeWorkspace(folderPaths: string[] = []): {
  workspace: WorkspaceApi;
  gitWatcher: { dispose: ReturnType<typeof vi.fn> };
  triggerGitCreate: () => void;
  triggerFolderChange: () => void;
  triggerConfigChange: (section: string) => void;
} {
  let gitCreateHandler: (() => void) | null = null;
  let folderChangeHandler: ((e: vscode.WorkspaceFoldersChangeEvent) => void) | null = null;
  let configChangeHandler: ((e: vscode.ConfigurationChangeEvent) => void) | null = null;

  const gitWatcher = {
    onDidCreate(handler: () => void) {
      gitCreateHandler = handler;
      return { dispose: vi.fn() };
    },
    dispose: vi.fn()
  };

  const workspace: WorkspaceApi = {
    workspaceFolders: folderPaths.map((p) => ({ uri: { fsPath: p } }) as vscode.WorkspaceFolder),
    createFileSystemWatcher: vi.fn(() => gitWatcher as unknown as vscode.FileSystemWatcher),
    onDidChangeWorkspaceFolders(handler: (e: vscode.WorkspaceFoldersChangeEvent) => void) {
      folderChangeHandler = handler;
      return { dispose: vi.fn() };
    },
    onDidChangeConfiguration(handler: (e: vscode.ConfigurationChangeEvent) => void) {
      configChangeHandler = handler;
      return { dispose: vi.fn() };
    }
  };

  return {
    workspace,
    gitWatcher,
    triggerGitCreate: () => gitCreateHandler?.(),
    triggerFolderChange: () => folderChangeHandler?.({} as vscode.WorkspaceFoldersChangeEvent),
    triggerConfigChange: (section: string) =>
      configChangeHandler?.({
        affectsConfiguration: (s) => s === section
      } as vscode.ConfigurationChangeEvent)
  };
}

const fakeCtx = {} as unknown as vscode.ExtensionContext;

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ngg-watchForRepos-test-"));
  vi.mocked(initExtension).mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("watchForRepos", () => {
  it("watches **/.git for creation events", () => {
    const { workspace } = makeFakeWorkspace();
    watchForRepos(fakeCtx, workspace);
    expect(workspace.createFileSystemWatcher).toHaveBeenCalledWith("**/.git");
  });

  it("calls initExtension when a .git is created and repos are found", async () => {
    execSync("git init", { cwd: tmpDir });
    const { workspace, triggerGitCreate } = makeFakeWorkspace([tmpDir]);

    watchForRepos(fakeCtx, workspace);
    triggerGitCreate();
    await vi.waitFor(() => expect(initExtension).toHaveBeenCalledWith(fakeCtx, [tmpDir]));
  });

  it("calls initExtension when workspace folders change and repos are found", async () => {
    execSync("git init", { cwd: tmpDir });
    const { workspace, triggerFolderChange } = makeFakeWorkspace([tmpDir]);

    watchForRepos(fakeCtx, workspace);
    triggerFolderChange();
    await vi.waitFor(() => expect(initExtension).toHaveBeenCalledWith(fakeCtx, [tmpDir]));
  });

  it("does not call initExtension when no repos are found after detection", async () => {
    const { workspace, triggerGitCreate } = makeFakeWorkspace([tmpDir]);

    watchForRepos(fakeCtx, workspace);
    triggerGitCreate();
    await new Promise((r) => setTimeout(r, 50));
    expect(initExtension).not.toHaveBeenCalled();
  });

  it("disposes watchers after repos are found", async () => {
    execSync("git init", { cwd: tmpDir });
    const { workspace, gitWatcher, triggerGitCreate } = makeFakeWorkspace([tmpDir]);

    watchForRepos(fakeCtx, workspace);
    triggerGitCreate();
    await vi.waitFor(() => expect(initExtension).toHaveBeenCalled());
    expect(gitWatcher.dispose).toHaveBeenCalled();
  });

  it("dispose() is idempotent", () => {
    const { workspace, gitWatcher } = makeFakeWorkspace();
    const detector = watchForRepos(fakeCtx, workspace);
    detector.dispose();
    detector.dispose();
    expect(gitWatcher.dispose).toHaveBeenCalledTimes(1);
  });

  it("does not double-initExtension when both events fire before check resolves", async () => {
    execSync("git init", { cwd: tmpDir });
    const { workspace, triggerGitCreate, triggerFolderChange } = makeFakeWorkspace([tmpDir]);

    watchForRepos(fakeCtx, workspace);
    triggerGitCreate();
    triggerFolderChange();

    await vi.waitFor(() => expect(initExtension).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(initExtension).toHaveBeenCalledTimes(1);
  });
});

describe("watchForRepos — mocked findGitRepos for timing control", () => {
  it("does not initExtension after external dispose while check is in-flight", async () => {
    const { workspace, triggerGitCreate } = makeFakeWorkspace([tmpDir]);

    let resolveFindGitRepos!: (v: string[]) => void;
    vi.spyOn(await import("@/backend/queries/repoSearch"), "findGitRepos").mockImplementation(
      () => new Promise((r) => (resolveFindGitRepos = r))
    );

    const detector = watchForRepos(fakeCtx, workspace);
    triggerGitCreate();
    detector.dispose();
    resolveFindGitRepos([tmpDir]);

    await new Promise((r) => setTimeout(r, 20));
    expect(initExtension).not.toHaveBeenCalled();
  });
});
