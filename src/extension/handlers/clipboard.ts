import * as vscode from "vscode";
export async function copyToClipboard(params: unknown) {
  if (typeof params !== "string") {
    throw new Error("Invalid copyToClipboard parameters");
  }

  try {
    await vscode.env.clipboard.writeText(params);
    return true;
  } catch {
    return false;
  }
}
