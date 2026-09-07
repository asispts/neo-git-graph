import { describe, expect, it, vi } from "vitest";

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
  const bridge = webviewBridgeFactory(webview as unknown as import("vscode").Webview);

  return {
    bridge,
    dispose,
    receive: (message: RequestMessage) => receiveMessage!(message)
  };
}

describe("webviewBridgeFactory", () => {
  it("disposes its message listener", () => {
    const { bridge, dispose } = createBridge();

    bridge.dispose();

    expect(dispose).toHaveBeenCalledOnce();
  });

  it("propagates handler errors", async () => {
    const { bridge, receive } = createBridge();
    const failure = new Error("failed");
    bridge.onMessage("selectRepo", async () => {
      throw failure;
    });

    await expect(receive({ command: "selectRepo", repo: "/repo" })).rejects.toBe(failure);
  });
});
