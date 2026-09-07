import * as vscode from "vscode";

import { EXTENSION_NAME } from "@/extension/constants";

let _channel: vscode.LogOutputChannel | undefined;

export const logger = {
  init: (ctx: vscode.ExtensionContext) => {
    _channel = vscode.window.createOutputChannel(EXTENSION_NAME, { log: true });
    ctx.subscriptions.push(_channel);
  },

  error: (message: string | Error, ...args: unknown[]) => {
    _channel?.error(message, ...args);
  },

  warn: (message: string, ...args: unknown[]) => {
    _channel?.warn(message, ...args);
  },

  info: (message: string, ...args: unknown[]) => {
    _channel?.info(message, ...args);
  },

  debug: (message: string, ...args: unknown[]) => {
    _channel?.debug(message, ...args);
  }
};
