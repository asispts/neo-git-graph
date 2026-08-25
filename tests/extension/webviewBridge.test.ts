import { describe, expect, it, vi } from "vitest";

import { webviewBridgeFactory } from "@/old-extension/webviewBridge";
import type { RepoFileWatcher } from "@/repoFileWatcher";
import type { RequestMessage } from "@/types";

function createBridge() {
  let receiveMessage: ((message: RequestMessage) => Promise<void>) | undefined;
  const webview = {
    onDidReceiveMessage: vi.fn((handler: (message: RequestMessage) => Promise<void>) => {
      receiveMessage = handler;
      return { dispose: vi.fn() };
    }),
    postMessage: vi.fn()
  };
  const repoFileWatcher = { mute: vi.fn(), unmute: vi.fn() };
  const bridge = webviewBridgeFactory(
    webview as unknown as import("vscode").Webview,
    repoFileWatcher as unknown as RepoFileWatcher
  );

  return {
    bridge,
    repoFileWatcher,
    receive: (message: RequestMessage) => receiveMessage!(message)
  };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("webviewBridgeFactory", () => {
  it("unmutes the repository watcher when a handler rejects", async () => {
    const { bridge, repoFileWatcher, receive } = createBridge();
    const failure = new Error("failed");
    bridge.onMessage("loadRepos", async () => {
      throw failure;
    });

    await expect(receive({ command: "loadRepos", check: false })).rejects.toBe(failure);

    expect(repoFileWatcher.mute).toHaveBeenCalledOnce();
    expect(repoFileWatcher.unmute).toHaveBeenCalledOnce();
  });

  it("keeps one mute active for each concurrent handler", async () => {
    const { bridge, repoFileWatcher, receive } = createBridge();
    const first = deferred();
    const second = deferred();
    const handlers = [first, second];
    let nextHandler = 0;
    bridge.onMessage("loadRepos", () => handlers[nextHandler++].promise);

    const firstMessage = receive({ command: "loadRepos", check: false });
    const secondMessage = receive({ command: "loadRepos", check: false });
    expect(repoFileWatcher.mute).toHaveBeenCalledTimes(2);
    expect(repoFileWatcher.unmute).not.toHaveBeenCalled();

    first.resolve();
    await firstMessage;
    expect(repoFileWatcher.unmute).toHaveBeenCalledOnce();

    second.resolve();
    await secondMessage;
    expect(repoFileWatcher.unmute).toHaveBeenCalledTimes(2);
  });
});
