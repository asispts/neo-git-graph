import * as vscode from "vscode";

import type { RpcMethod, RpcResponse } from "@/types";

import { rpcHandlers } from "./handlers";

function isRpcMethod(method: string): method is RpcMethod {
  return Object.hasOwn(rpcHandlers, method);
}

type RpcRequestEnvelope = {
  kind: "rpc.request";
  id: string;
  method: string;
  params: unknown;
};

function isRpcRequest(message: unknown): message is RpcRequestEnvelope {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "rpc.request" &&
    "id" in message &&
    typeof message.id === "string" &&
    "method" in message &&
    typeof message.method === "string" &&
    "params" in message
  );
}

export function createRpcServer() {
  return {
    attach: (webview: vscode.Webview) => {
      const listener = webview.onDidReceiveMessage(async (message: unknown) => {
        if (!isRpcRequest(message)) {
          return;
        }

        if (!isRpcMethod(message.method)) {
          const response: RpcResponse = {
            kind: "rpc.response",
            id: message.id,
            success: false,
            error: `Unknown RPC method: ${message.method}`
          };

          await webview.postMessage(response);
          return;
        }

        try {
          const result = await rpcHandlers[message.method](message.params);

          const response: RpcResponse = {
            kind: "rpc.response",
            id: message.id,
            success: true,
            result
          };

          await webview.postMessage(response);
        } catch (err) {
          const response: RpcResponse = {
            kind: "rpc.response",
            id: message.id,
            success: false,
            error: err instanceof Error ? err.message : String(err)
          };

          await webview.postMessage(response);
        }
      });

      return listener;
    }
  };
}
