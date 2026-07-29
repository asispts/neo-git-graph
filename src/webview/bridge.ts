import type { RequestMessage, ResponseMessage } from "@/types";

type ResponseOf<T extends ResponseMessage["command"]> = Extract<ResponseMessage, { command: T }>;
type AnyHandler = (msg: ResponseMessage) => void;

const vscode = acquireVsCodeApi();
const handlers = new Map<ResponseMessage["command"], Set<AnyHandler>>();

window.addEventListener("message", (event: MessageEvent<ResponseMessage>) => {
  const msg = event.data;
  handlers.get(msg.command)?.forEach((handler) => handler(msg));
});

export function sendMessage(msg: RequestMessage): void {
  vscode.postMessage(msg);
}

export function onMessage<T extends ResponseMessage["command"]>(
  command: T,
  handler: (msg: ResponseOf<T>) => void
): () => void {
  let set = handlers.get(command);
  if (!set) {
    set = new Set();
    handlers.set(command, set);
  }
  set.add(handler as AnyHandler);
  return () => set.delete(handler as AnyHandler);
}

export function readState<T>(): T | null {
  const state = vscode.getState();
  return state !== null && typeof state === "object" ? (state as T) : null;
}

export function writeState<T>(state: T): void {
  vscode.setState(state);
}
