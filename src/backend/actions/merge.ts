import type { SimpleGit } from "simple-git";

import type { ActionResult } from "@/backend/types";

type MergeBranchInput = {
  branchName: string;
  createNewCommit: boolean;
};

type MergeCommitInput = {
  commitHash: string;
  createNewCommit: boolean;
};

export async function mergeBranch(git: SimpleGit, input: MergeBranchInput): Promise<ActionResult> {
  try {
    const args = input.createNewCommit ? [input.branchName, "--no-ff"] : [input.branchName];
    await git.merge(args);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function mergeCommit(git: SimpleGit, input: MergeCommitInput): Promise<ActionResult> {
  try {
    const args = input.createNewCommit ? [input.commitHash, "--no-ff"] : [input.commitHash];
    await git.merge(args);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}
