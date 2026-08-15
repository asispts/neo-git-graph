import type { SimpleGit } from "simple-git";

import type { QueryResult } from "@/backend/types";
import { isGitRepository } from "@/backend/utils/git";

type LoadBranchesInput = {
  showRemoteBranches: boolean;
  hard: boolean;
  repo: string;
  gitPath: string;
};

export async function loadBranches(
  git: SimpleGit,
  input: LoadBranchesInput
): Promise<QueryResult<"loadBranches">> {
  const { showRemoteBranches, hard, repo, gitPath } = input;

  let branches: string[];
  let head: string | null;
  let error: boolean;

  try {
    const summary = await (showRemoteBranches ? git.branch() : git.branchLocal());
    head = summary.detached ? null : summary.current || null;
    branches = head ? [head, ...summary.all.filter((b) => b !== head)] : [...summary.all];
    error = false;
  } catch {
    branches = [];
    head = null;
    error = true;
  }

  const isRepo = error ? await isGitRepository(repo, gitPath) : true;

  return { repo, branches, head, hard, isRepo };
}
