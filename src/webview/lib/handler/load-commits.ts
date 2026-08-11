import { batch } from "@preact/signals";

import type { ResponseMessage } from "@/types";
import { SHOW_ALL_BRANCHES } from "@/webview/constants";
import {
  commitHead,
  commitList,
  moreCommitsAvailable,
  selectedBranch,
  selectedRepo
} from "@/webview/lib/stores";

type LoadCommitsMessage = Extract<ResponseMessage, { command: "loadCommits" }>;

export function handleLoadCommits(msg: LoadCommitsMessage) {
  const branch = selectedBranch.value;
  const requested = branch === SHOW_ALL_BRANCHES ? "" : branch;

  if (msg.repo !== selectedRepo.value || msg.branchName !== requested) {
    return;
  }

  batch(() => {
    commitList.value = msg.commits;
    commitHead.value = msg.head;
    moreCommitsAvailable.value = msg.moreCommitsAvailable;
  });
}
