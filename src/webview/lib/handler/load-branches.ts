import { batch } from "@preact/signals";

import type { ResponseMessage } from "@/types";
import { SHOW_ALL_BRANCHES } from "@/webview/constants";
import { selectBranch } from "@/webview/lib/actions";
import { branchList, headBranch, selectedBranch, selectedRepo } from "@/webview/lib/stores";
import { getWebviewConfig } from "@/webview/lib/webview-config";

type LoadBranchesMessage = Extract<ResponseMessage, { command: "loadBranches" }>;

export function handleLoadBranches(msg: LoadBranchesMessage) {
  if (msg.repo !== selectedRepo.value) {
    return;
  }

  const current = selectedBranch.value;
  const valid =
    current === SHOW_ALL_BRANCHES || (current !== undefined && msg.branches.includes(current));

  batch(() => {
    branchList.value = msg.branches;
    headBranch.value = msg.head;
  });

  if (!valid) {
    const fallback = getWebviewConfig().showCurrentBranchByDefault
      ? (msg.head ?? SHOW_ALL_BRANCHES)
      : SHOW_ALL_BRANCHES;
    selectBranch(fallback);
  }
}
