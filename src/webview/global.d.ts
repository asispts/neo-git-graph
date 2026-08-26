declare module "*.css";

declare function acquireVsCodeApi(): {
  getState(): unknown;
  setState(state: unknown): void;
  postMessage(message: import("@/types").RequestMessage | import("@/rpc/types").RpcRequest): void;
};

interface Window {
  l10n: import("@/old-extension/l10n/webviewL10n").LocalizedStrings;
}
