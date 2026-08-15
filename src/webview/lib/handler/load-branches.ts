import { batch } from "@preact/signals";

import type { ResponseMessage } from "@/types";
import { SHOW_ALL_BRANCHES } from "@/webview/constants";
import { branchList, headBranch, selectedBranch, selectedRepo } from "@/webview/lib/stores";

type LoadBranchesMessage = Extract<ResponseMessage, { command: "loadBranches" }>;

export function handleLoadBranches(msg: LoadBranchesMessage) {
  if (msg.repo !== selectedRepo.value) {
    return;
  }

  batch(() => {
    branchList.value = msg.branches;
    headBranch.value = msg.head;

    const current = selectedBranch.value;
    const valid =
      current === SHOW_ALL_BRANCHES || (current !== undefined && msg.branches.includes(current));

    const fallback = viewState.showCurrentBranchByDefault
      ? (msg.head ?? SHOW_ALL_BRANCHES)
      : SHOW_ALL_BRANCHES;

    selectedBranch.value = valid ? current : fallback;
  });
}
