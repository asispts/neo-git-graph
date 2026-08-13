import type { ResponseMessage } from "@/types";
import { closeCommitDetails } from "@/webview/lib/actions";
import { commitDetails, expandedCommit } from "@/webview/lib/stores";

type CommitDetailsMessage = Extract<ResponseMessage, { command: "commitDetails" }>;

export function handleCommitDetails(msg: CommitDetailsMessage) {
  if (msg.commitDetails === null) {
    closeCommitDetails();
    return;
  }

  if (msg.commitDetails.hash !== expandedCommit.value) {
    return;
  }

  commitDetails.value = msg.commitDetails;
}
