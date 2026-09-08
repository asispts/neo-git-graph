import type { RpcMethod, RpcMethodMap, RpcRequest } from "@/types";
import { initRpcHandler, type PendingRpcRequest } from "@/webview/lib/rpc/rpc-handler";
import { vscode } from "@/webview/lib/vscode";

const RPC_TIMEOUT_MS = 30_000;

const requests = new Map<string, PendingRpcRequest>();
let initialized = false;

export const rpcClient = {
  init(): void {
    if (initialized) {
      return;
    }

    initialized = true;
    initRpcHandler(requests);
  },
  request<M extends RpcMethod>(
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
