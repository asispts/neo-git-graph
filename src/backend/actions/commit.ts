import type { SimpleGit } from "simple-git";

import type { GitResetMode } from "@/backend/types";

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
export async function checkoutCommit(git: SimpleGit, input: CheckoutCommitInput): Promise<void> {
  await git.checkout(input.commitHash);
}

export async function cherrypickCommit(
  git: SimpleGit,
  input: CherrypickCommitInput
): Promise<void> {
  const args = ["cherry-pick"];
  if (input.parentIndex > 0) args.push("-m", String(input.parentIndex));
  args.push(input.commitHash);
  await git.raw(args);
}

export async function revertCommit(git: SimpleGit, input: RevertCommitInput): Promise<void> {
  const args = ["revert", "--no-edit"];
  if (input.parentIndex > 0) args.push("-m", String(input.parentIndex));
  args.push(input.commitHash);
  await git.raw(args);
}

export async function resetToCommit(git: SimpleGit, input: ResetToCommitInput): Promise<void> {
  await git.raw(["reset", "--" + input.resetMode, input.commitHash]);
}
