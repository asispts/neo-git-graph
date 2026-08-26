import type { RpcMethod, RpcMethodMap, RpcRequest, RpcResponse } from "@/rpc/types";
import { vscode } from "@/webview/lib/vscode";

const RPC_TIMEOUT_MS = 30_000;

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (value: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};
const requests = new Map<string, PendingRequest>();

export const rpc = {
  call<M extends RpcMethod>(
    method: M,
    params: RpcMethodMap[M]["params"]
  ): Promise<RpcMethodMap[M]["result"]> {
    const id = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (requests.delete(id)) {
          reject(new Error(`RPC request timed out: ${method}`));
        }
      }, RPC_TIMEOUT_MS);

      requests.set(id, {
        resolve: (value) => resolve(value as RpcMethodMap[M]["result"]),
        reject,
        timeout
      });

      const request = {
        kind: "rpc.request",
        id,
        method,
        params
      } as RpcRequest<M>;

      try {
        vscode.postMessage(request);
      } catch (error) {
        clearTimeout(timeout);
        requests.delete(id);
        reject(error);
      }
    });
  }
};

export function handleRpcResponse(message: unknown): boolean {
  if (!isRpcResponse(message)) {
    return false;
  }

  const request = requests.get(message.id);
  if (request === undefined) {
    return true;
  }
  requests.delete(message.id);
  clearTimeout(request.timeout);

  if (message.success) {
    request.resolve(message.result);
  } else {
    request.reject(new Error(message.error));
  }

  return true;
}

function isRpcResponse(message: unknown): message is RpcResponse {
  if (
    typeof message !== "object" ||
    message === null ||
    !("kind" in message) ||
    message.kind !== "rpc.response" ||
    !("id" in message) ||
    typeof message.id !== "string" ||
    !("success" in message) ||
    typeof message.success !== "boolean"
  ) {
    return false;
  }

  if (message.success) {
    return "result" in message;
  }

  return "error" in message && typeof message.error === "string";
}
