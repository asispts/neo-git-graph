import type { RequestMessage, ResponseMessage } from "@/types";

import { vscodeApi } from "./api";

type Command = ResponseMessage["command"];
type ResponseOf<T extends Command> = Extract<ResponseMessage, { command: T }>;
type AnyHandler = (msg: ResponseMessage) => void;

const handlers = new Map<Command, Set<AnyHandler>>();

window.addEventListener("message", (event: MessageEvent<ResponseMessage>) => {
  const msg = event.data;
  handlers.get(msg.command)?.forEach((handler) => handler(msg));
});

export function sendMessage(msg: RequestMessage): void {
  vscodeApi.postMessage(msg);
}

export function onMessage<T extends Command>(
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
