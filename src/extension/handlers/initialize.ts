import * as vscode from "vscode";

import { getWebviewLocalizedStrings } from "@/old-extension/l10n/webviewL10n";
import type { WebviewConfig } from "@/types";

export function webviewInitialize() {
  const webviewConfig: WebviewConfig = {
    autoCenterCommitDetailsView: true,
    dateFormat: "Date & Time",
    fetchAvatars: false,
    graphColours: ["#0085d9", "#d9008f", "#00d90a", "#d98500", "#a300d9", "#ff0000"],
    graphStyle: "rounded",
    initialLoadCommits: 300,
    loadMoreCommits: 75,
    locale: vscode.env.language,
    showCurrentBranchByDefault: false
  };

  return {
    l10n: getWebviewLocalizedStrings(),
    webviewConfig
  };
}
