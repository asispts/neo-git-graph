import * as fs from "node:fs";
import * as path from "node:path";

import * as vscode from "vscode";

const FS_REGEX = /\\/g;

export function isDirectory(path: string) {
  return new Promise<boolean>((resolve) => {
    fs.stat(path, (err, stats) => {
      resolve(err ? false : stats.isDirectory());
    });
  });
}

export function doesPathExist(path: string) {
  return new Promise<boolean>((resolve) => {
    fs.stat(path, (err) => resolve(!err));
  });
}

export function getPathFromUri(uri: vscode.Uri) {
  return uri.fsPath.replace(FS_REGEX, "/");
}

export function getPathFromStr(str: string) {
  return str.replace(FS_REGEX, "/");
}

export function buildExtensionUri(extensionPath: string, ...pathComps: string[]) {
  return vscode.Uri.file(path.join(extensionPath, ...pathComps));
}
