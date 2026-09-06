import * as vscode from "vscode";

import type { RpcNotification, RpcNotificationMap, RpcNotificationName } from "@/types";

let _webview: vscode.Webview | undefined;

export const rpcNotify = {
  async notify<N extends RpcNotificationName>(
    name: N,
    message: RpcNotificationMap[N]
  ): Promise<void> {
    if (_webview === undefined) {
      return;
    }

    const payload = {
      kind: "rpc.notify",
      id: crypto.randomUUID(),
      name,
      message
    } as RpcNotification<N>;

    await _webview.postMessage(payload);
  }
};

export function initRpcNotify(webview: vscode.Webview): vscode.Disposable {
  _webview = webview;

  return new vscode.Disposable(() => {
    if (_webview === webview) {
      _webview = undefined;
    }
  });
}
