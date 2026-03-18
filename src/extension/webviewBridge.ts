import * as vscode from "vscode";

import { RequestMessage, ResponseMessage } from "../types";

export function webviewBridgeFactory(webview: vscode.Webview) {
  return {
    post: (msg: ResponseMessage) => webview.postMessage(msg),
    onMessage: (handler: (msg: RequestMessage) => void, disposables: vscode.Disposable[]) =>
      webview.onDidReceiveMessage(handler, null, disposables)
  };
}

export type WebviewBridge = ReturnType<typeof webviewBridgeFactory>;
