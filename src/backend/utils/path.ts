import * as fs from "node:fs";
import * as path from "node:path";

import * as vscode from "vscode";

const FS_REGEX = /\\/g;

export function isDirectory(filePath: string) {
  return new Promise<boolean>((resolve) => {
    fs.stat(filePath, (err, stats) => {
      resolve(err ? false : stats.isDirectory());
    });
  });
}

export function doesPathExist(filePath: string) {
  return new Promise<boolean>((resolve) => {
    fs.stat(filePath, (err) => resolve(!err));
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
