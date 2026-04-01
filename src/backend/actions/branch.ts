import type { SimpleGit } from "simple-git";

import type { ActionResult } from "@/backend/types";

type CreateBranchInput = {
  branchName: string;
  commitHash: string;
};

type DeleteBranchInput = {
  branchName: string;
  forceDelete: boolean;
};
type RenameBranchInput = {
  oldName: string;
  newName: string;
};
type CheckoutBranchInput = {
  branchName: string;
  remoteBranch: string | null;
};
export async function createBranch(
  git: SimpleGit,
  input: CreateBranchInput
): Promise<ActionResult> {
  try {
    await git.raw(["branch", input.branchName, input.commitHash]);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function deleteBranch(
  git: SimpleGit,
  input: DeleteBranchInput
): Promise<ActionResult> {
  try {
    await git.deleteLocalBranch(input.branchName, input.forceDelete);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function renameBranch(
  git: SimpleGit,
  input: RenameBranchInput
): Promise<ActionResult> {
  try {
    await git.raw(["branch", "-m", input.oldName, input.newName]);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function checkoutBranch(
  git: SimpleGit,
  input: CheckoutBranchInput
): Promise<ActionResult> {
  try {
    if (input.remoteBranch === null) {
      await git.checkout(input.branchName);
    } else {
      await git.checkoutBranch(input.branchName, input.remoteBranch);
    }
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}
