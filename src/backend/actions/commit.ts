import type { SimpleGit } from "simple-git";

import type { ActionResult, GitResetMode } from "@/backend/types";

type CheckoutCommitInput = {
  commitHash: string;
};
type CherrypickCommitInput = {
  commitHash: string;
  parentIndex: number;
};
type RevertCommitInput = {
  commitHash: string;
  parentIndex: number;
};
type ResetToCommitInput = {
  commitHash: string;
  resetMode: GitResetMode;
};
export async function checkoutCommit(
  git: SimpleGit,
  input: CheckoutCommitInput
): Promise<ActionResult> {
  try {
    await git.checkout(input.commitHash);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function cherrypickCommit(
  git: SimpleGit,
  input: CherrypickCommitInput
): Promise<ActionResult> {
  try {
    const args = ["cherry-pick"];
    if (input.parentIndex > 0) args.push("-m", String(input.parentIndex));
    args.push(input.commitHash);
    await git.raw(args);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function revertCommit(
  git: SimpleGit,
  input: RevertCommitInput
): Promise<ActionResult> {
  try {
    const args = ["revert", "--no-edit"];
    if (input.parentIndex > 0) args.push("-m", String(input.parentIndex));
    args.push(input.commitHash);
    await git.raw(args);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function resetToCommit(
  git: SimpleGit,
  input: ResetToCommitInput
): Promise<ActionResult> {
  try {
    await git.raw(["reset", "--" + input.resetMode, input.commitHash]);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}
