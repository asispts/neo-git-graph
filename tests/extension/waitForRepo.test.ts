import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";

vi.mock("@/backend/queries/repoSearch");
vi.mock("@/extension/bootstrap");

import { findGitRepos } from "@/backend/queries/repoSearch";
import { bootstrap } from "@/extension/bootstrap";
import { waitForRepo } from "@/extension/waitForRepo";
import type { WorkspaceApi } from "@/extension/waitForRepo";

function makeFakeWorkspace(folderPaths: string[] = []): {
  workspace: WorkspaceApi;
  gitWatcher: { dispose: ReturnType<typeof vi.fn> };
  triggerGitCreate: () => void;
  triggerFolderChange: () => void;
} {
  let gitCreateHandler: (() => void) | null = null;
  let folderChangeHandler: (() => void) | null = null;

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
    onDidChangeWorkspaceFolders(handler: () => void) {
      folderChangeHandler = handler;
      return { dispose: vi.fn() };
    }
  };

  return {
    workspace,
    gitWatcher,
    triggerGitCreate: () => gitCreateHandler?.(),
    triggerFolderChange: () => folderChangeHandler?.()
  };
}

const fakeCtx = {} as unknown as vscode.ExtensionContext;

beforeEach(() => {
  vi.mocked(findGitRepos).mockResolvedValue([]);
  vi.mocked(bootstrap).mockReturnValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("waitForRepo", () => {
  it("watches **/.git for creation events", () => {
    const { workspace } = makeFakeWorkspace();
    waitForRepo(fakeCtx, workspace);
    expect(workspace.createFileSystemWatcher).toHaveBeenCalledWith("**/.git");
  });

  it("calls bootstrap when a .git is created and repos are found", async () => {
    const { workspace, triggerGitCreate } = makeFakeWorkspace(["/workspace/project"]);
    vi.mocked(findGitRepos).mockResolvedValue(["/workspace/project"]);

    waitForRepo(fakeCtx, workspace);
    triggerGitCreate();
    await vi.waitFor(() => expect(bootstrap).toHaveBeenCalledWith(fakeCtx, ["/workspace/project"]));
  });

  it("calls bootstrap when workspace folders change and repos are found", async () => {
    const { workspace, triggerFolderChange } = makeFakeWorkspace(["/workspace/project"]);
    vi.mocked(findGitRepos).mockResolvedValue(["/workspace/project"]);

    waitForRepo(fakeCtx, workspace);
    triggerFolderChange();
    await vi.waitFor(() => expect(bootstrap).toHaveBeenCalledWith(fakeCtx, ["/workspace/project"]));
  });

  it("does not call bootstrap when no repos are found after detection", async () => {
    const { workspace, triggerGitCreate } = makeFakeWorkspace(["/workspace/project"]);
    vi.mocked(findGitRepos).mockResolvedValue([]);

    waitForRepo(fakeCtx, workspace);
    triggerGitCreate();
    await new Promise((r) => setTimeout(r, 50));
    expect(bootstrap).not.toHaveBeenCalled();
  });

  it("disposes watchers after repos are found", async () => {
    const { workspace, gitWatcher, triggerGitCreate } = makeFakeWorkspace(["/workspace/project"]);
    vi.mocked(findGitRepos).mockResolvedValue(["/workspace/project"]);

    waitForRepo(fakeCtx, workspace);
    triggerGitCreate();
    await vi.waitFor(() => expect(bootstrap).toHaveBeenCalled());
    expect(gitWatcher.dispose).toHaveBeenCalled();
  });

  it("dispose() is idempotent", () => {
    const { workspace, gitWatcher } = makeFakeWorkspace();
    const detector = waitForRepo(fakeCtx, workspace);
    detector.dispose();
    detector.dispose();
    expect(gitWatcher.dispose).toHaveBeenCalledTimes(1);
  });

  it("does not double-bootstrap when both events fire before check resolves", async () => {
    const { workspace, triggerGitCreate, triggerFolderChange } = makeFakeWorkspace([
      "/workspace/project"
    ]);
    vi.mocked(findGitRepos).mockResolvedValue(["/workspace/project"]);

    waitForRepo(fakeCtx, workspace);
    triggerGitCreate();
    triggerFolderChange();

    await vi.waitFor(() => expect(bootstrap).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(bootstrap).toHaveBeenCalledTimes(1);
  });

  it("does not bootstrap after external dispose while check is in-flight", async () => {
    const { workspace, triggerGitCreate } = makeFakeWorkspace(["/workspace/project"]);

    let resolveFindGitRepos!: (v: string[]) => void;
    vi.mocked(findGitRepos).mockImplementation(() => new Promise((r) => (resolveFindGitRepos = r)));

    const detector = waitForRepo(fakeCtx, workspace);
    triggerGitCreate();
    detector.dispose();
    resolveFindGitRepos(["/workspace/project"]);

    await new Promise((r) => setTimeout(r, 20));
    expect(bootstrap).not.toHaveBeenCalled();
  });
});
