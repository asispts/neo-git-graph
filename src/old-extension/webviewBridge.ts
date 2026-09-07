import * as vscode from "vscode";

import { muteGitRepoWatcher, unmuteGitRepoWatcher } from "@/extension/watchers/git-repo.watcher";
import type { RequestMessage, ResponseMessage } from "@/types";

export function webviewBridgeFactory(webview: vscode.Webview) {
  const handlers = new Map<string, (msg: RequestMessage) => void | Promise<void>>();

  const listener = webview.onDidReceiveMessage(async (msg: RequestMessage) => {
    const handler = handlers.get(msg.command);
    if (!handler) {
      return;
    }
    muteGitRepoWatcher();
    try {
      await handler(msg);
    } finally {
      unmuteGitRepoWatcher();
    }
  });

  return {
    dispose: () => listener.dispose(),
    post: (msg: ResponseMessage) => webview.postMessage(msg),
    onMessage: <T extends RequestMessage["command"]>(
      command: T,
      handler: (msg: Extract<RequestMessage, { command: T }>) => void | Promise<void>
    ) => {
      handlers.set(command, handler as (msg: RequestMessage) => void | Promise<void>);
    }
  };
}

export type WebviewBridge = ReturnType<typeof webviewBridgeFactory>;
