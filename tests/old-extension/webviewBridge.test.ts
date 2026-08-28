import { describe, expect, it, vi } from "vitest";

import type { RepoFileWatcher } from "@/old-extension/repoFileWatcher";
import { webviewBridgeFactory } from "@/old-extension/webviewBridge";
import type { RequestMessage } from "@/types";

function createBridge() {
  let receiveMessage: ((message: RequestMessage) => Promise<void>) | undefined;
  const dispose = vi.fn();
  const webview = {
    onDidReceiveMessage: vi.fn((handler: (message: RequestMessage) => Promise<void>) => {
      receiveMessage = handler;
      return { dispose };
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
    dispose,
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
  it("disposes its message listener", () => {
    const { bridge, dispose } = createBridge();

    bridge.dispose();

    expect(dispose).toHaveBeenCalledOnce();
  });

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
