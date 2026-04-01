import type { SimpleGit } from "simple-git";

import type { ActionPayload } from "@/backend/types";

export async function checkoutCommit(
  git: SimpleGit,
  input: ActionPayload<"checkoutCommit">
): Promise<void> {
  await git.checkout(input.commitHash);
}

export async function cherrypickCommit(
  git: SimpleGit,
  input: ActionPayload<"cherrypickCommit">
): Promise<void> {
  const args = ["cherry-pick"];
  if (input.parentIndex > 0) args.push("-m", String(input.parentIndex));
  args.push(input.commitHash);
  await git.raw(args);
}

export async function revertCommit(
  git: SimpleGit,
  input: ActionPayload<"revertCommit">
): Promise<void> {
  const args = ["revert", "--no-edit"];
  if (input.parentIndex > 0) args.push("-m", String(input.parentIndex));
  args.push(input.commitHash);
  await git.raw(args);
}

export async function resetToCommit(
  git: SimpleGit,
  input: ActionPayload<"resetToCommit">
): Promise<void> {
  await git.raw(["reset", "--" + input.resetMode, input.commitHash]);
}
