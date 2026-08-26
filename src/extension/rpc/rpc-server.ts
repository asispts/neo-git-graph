import * as vscode from "vscode";

import { copyToClipboard } from "@/old-extension/utils/clipboard";
import type { RpcMethod, RpcMethodMap, RpcResponse } from "@/rpc/types";

type RpcHandlers = {
  [M in RpcMethod]: (
    params: unknown
  ) => RpcMethodMap[M]["result"] | Promise<RpcMethodMap[M]["result"]>;
};

const handlers = {
  "clipboard.copy": async (params: unknown) => {
    if (typeof params !== "string") {
      throw new Error("Invalid copyToClipboard parameters");
    }

    return copyToClipboard(params);
  }
} satisfies RpcHandlers;

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
          const result = await handlers[message.method](message.params);

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

function isRpcMethod(method: string): method is RpcMethod {
  return Object.hasOwn(handlers, method);
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
