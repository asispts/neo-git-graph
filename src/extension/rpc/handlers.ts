import { copyToClipboard } from "@/extension/handlers/clipboard";
import { webviewInitialize } from "@/extension/handlers/initialize";
import { scanRepos } from "@/extension/handlers/scan-repo";
import type { RpcMethod, RpcMethodMap } from "@/types";

type RpcHandlers = {
  [M in RpcMethod]: (
    params: unknown
  ) => RpcMethodMap[M]["result"] | Promise<RpcMethodMap[M]["result"]>;
};

export const rpcHandlers = {
  "clipboard.copy": async (params: unknown) => copyToClipboard(params),
  "webview.initialize": async () => webviewInitialize(),
  "repo.scan": () => scanRepos()
} satisfies RpcHandlers;
