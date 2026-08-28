import { afterEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";

import { RepoFileWatcher } from "@/old-extension/repoFileWatcher";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("RepoFileWatcher", () => {
  it("stays muted until all active mutes are removed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    let onDidChange: ((uri: vscode.Uri) => void) | undefined;
    vi.spyOn(vscode.workspace, "createFileSystemWatcher").mockReturnValue({
      onDidCreate: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChange: vi.fn((handler: (uri: vscode.Uri) => void) => {
        onDidChange = handler;
        return { dispose: vi.fn() };
      }),
      onDidDelete: vi.fn(() => ({ dispose: vi.fn() })),
      dispose: vi.fn()
    } as unknown as vscode.FileSystemWatcher);
    const onRepoChange = vi.fn();
    const watcher = new RepoFileWatcher(onRepoChange);
    watcher.start("/repo");

    watcher.mute();
    watcher.mute();
    watcher.unmute();
    onDidChange?.({ fsPath: "/repo/file.txt" } as vscode.Uri);
    vi.advanceTimersByTime(750);
    expect(onRepoChange).not.toHaveBeenCalled();

    watcher.unmute();
    vi.advanceTimersByTime(1501);
    onDidChange?.({ fsPath: "/repo/file.txt" } as vscode.Uri);
    vi.advanceTimersByTime(750);
    expect(onRepoChange).toHaveBeenCalledOnce();
  });
});
