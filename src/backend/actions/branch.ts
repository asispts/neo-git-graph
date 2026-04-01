import type { SimpleGit } from "simple-git";

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
export async function createBranch(git: SimpleGit, input: CreateBranchInput): Promise<void> {
  await git.raw(["branch", input.branchName, input.commitHash]);
}

export async function deleteBranch(git: SimpleGit, input: DeleteBranchInput): Promise<void> {
  await git.deleteLocalBranch(input.branchName, input.forceDelete);
}

export async function renameBranch(git: SimpleGit, input: RenameBranchInput): Promise<void> {
  await git.raw(["branch", "-m", input.oldName, input.newName]);
}

export async function checkoutBranch(git: SimpleGit, input: CheckoutBranchInput): Promise<void> {
  if (input.remoteBranch === null) {
    await git.checkout(input.branchName);
  } else {
    await git.checkoutBranch(input.branchName, input.remoteBranch);
  }
}
