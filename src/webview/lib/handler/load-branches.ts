import type { ResponseMessage } from "@/types";
import { SHOW_ALL_BRANCHES } from "@/webview/constants";
import { selectBranch } from "@/webview/lib/actions";
import { branchList, headBranch, selectedBranch } from "@/webview/lib/stores";

type LoadBranchesMessage = Extract<ResponseMessage, { command: "loadBranches" }>;

export function handleLoadBranches(msg: LoadBranchesMessage) {
  branchList.value = msg.branches.map((value) => ({
    label: value.startsWith("remotes/") ? value.slice(8) : value,
    value
  }));
  headBranch.value = msg.head;

  const current = selectedBranch.value;
  const valid =
    current === SHOW_ALL_BRANCHES || (current !== undefined && msg.branches.includes(current));

  const fallback = viewState.showCurrentBranchByDefault
    ? (msg.head ?? SHOW_ALL_BRANCHES)
    : SHOW_ALL_BRANCHES;

  selectBranch(valid ? current : fallback);
}
