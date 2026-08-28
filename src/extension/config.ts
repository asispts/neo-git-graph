import * as vscode from "vscode";

import type { DateFormat, GraphStyle } from "@/types";

export const extConfig = {
  autoCenterCommitDetailsView: (): boolean => getConfig("autoCenterCommitDetailsView", true),
  dateFormat: (): DateFormat => getConfig("dateFormat", "Date & Time"),
  fetchAvatars: (): boolean => getConfig("fetchAvatars", false),
  gitBinary: () => vscode.workspace.getConfiguration("git").get("path", null) ?? "git",
  graphColours: (): string[] =>
    getConfig("graphColours", ["#0085d9", "#d9008f", "#00d90a", "#d98500", "#a300d9", "#ff0000"]),
  graphStyle: (): GraphStyle => getConfig("graphStyle", "rounded"),
  initialLoadCommits: (): number => getConfig("initialLoadCommits", 300),
  loadMoreCommits: (): number => getConfig("loadMoreCommits", 75),
  maxDepth: (): number => getConfig("maxDepthOfRepoSearch", 0),
  showCurrentBranchByDefault: (): boolean => getConfig("showCurrentBranchByDefault", false)
};

function getConfig<T>(key: string, defaultValue: T): T {
  return vscode.workspace.getConfiguration("neo-git-graph").get(key, defaultValue);
}
