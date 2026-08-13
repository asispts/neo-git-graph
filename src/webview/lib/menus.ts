import type { GitRef } from "@/backend/types";
import { copyToClipboard } from "@/webview/lib/actions";
import type { ContextMenuEntry } from "@/webview/types";

/**
 * Keys that tell a commit row or a ref label that its own menu is open.
 * A ref name is unique per type, so the pair identifies one label.
 */
export function commitMenuSource(hash: string) {
  return `commit:${hash}`;
}

export function refMenuSource(gitRef: GitRef) {
  return `ref:${gitRef.type}:${gitRef.name}`;
}

export function commitMenu(hash: string): Array<ContextMenuEntry> {
  return [
    {
      title: window.l10n.copyCommitHash,
      onClick: () => copyToClipboard(window.l10n.typeCommitHash, hash)
    }
  ];
}

export function refMenu(gitRef: GitRef): Array<ContextMenuEntry> {
  if (gitRef.type === "tag") {
    return [
      {
        title: window.l10n.copyTagName,
        onClick: () => copyToClipboard(window.l10n.typeTagName, gitRef.name)
      }
    ];
  }

  return [
    {
      title: window.l10n.copyBranchName,
      onClick: () => copyToClipboard(window.l10n.typeBranchName, gitRef.name)
    }
  ];
}
