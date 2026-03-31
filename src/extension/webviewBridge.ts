import * as vscode from "vscode";

import { RepoFileWatcher } from "@/repoFileWatcher";
import { RequestMessage, ResponseMessage } from "@/types";

export function webviewBridgeFactory(webview: vscode.Webview, repoFileWatcher: RepoFileWatcher) {
  const handlers = new Map<string, (msg: RequestMessage) => void | Promise<void>>();

  webview.onDidReceiveMessage(async (msg: RequestMessage) => {
    const handler = handlers.get(msg.command);
    if (!handler) return;
    repoFileWatcher.mute();
    await handler(msg);
    repoFileWatcher.unmute();
  });

  return {
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
