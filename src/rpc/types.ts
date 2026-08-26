export type RpcMethodMap = {
  "clipboard.copy": {
    params: string;
    result: boolean;
  };
};

export type RpcMethod = keyof RpcMethodMap;

export type RpcRequest<M extends RpcMethod = RpcMethod> = M extends RpcMethod
  ? {
      kind: "rpc.request";
      id: string;
      method: M;
      params: RpcMethodMap[M]["params"];
    }
  : never;

export type RpcResponse<M extends RpcMethod = RpcMethod> =
  | {
      kind: "rpc.response";
      id: string;
      success: true;
      result: RpcMethodMap[M]["result"];
    }
  | {
      kind: "rpc.response";
      id: string;
      success: false;
      error: string;
    };
