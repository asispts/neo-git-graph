declare module "*.css";

declare function acquireVsCodeApi(): {
  getState(): unknown;
  setState(state: unknown): void;
  postMessage(message: import("@/types").RequestMessage | import("@/rpc/types").RpcRequest): void;
};

declare let viewState: import("@/types").GitGraphViewState;

interface Window {
  readonly l10n: import("@/old-extension/l10n/webviewL10n").LocalizedStrings;
}
