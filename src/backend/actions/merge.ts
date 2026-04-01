import type { SimpleGit } from "simple-git";

type MergeBranchInput = {
  branchName: string;
  createNewCommit: boolean;
};

type MergeCommitInput = {
  commitHash: string;
  createNewCommit: boolean;
};

export async function mergeBranch(git: SimpleGit, input: MergeBranchInput): Promise<void> {
  const args = input.createNewCommit ? [input.branchName, "--no-ff"] : [input.branchName];
  await git.merge(args);
}

export async function mergeCommit(git: SimpleGit, input: MergeCommitInput): Promise<void> {
  const args = input.createNewCommit ? [input.commitHash, "--no-ff"] : [input.commitHash];
  await git.merge(args);
}
