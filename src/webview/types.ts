import type { GitFileChange } from "@/backend/types";

export type CommitBranchType = "*" | (string & {});

/** A file diff the user asked to open in the editor. */
export type DiffRequest = {
  repo: string;
  commitHash: string;
  file: GitFileChange;
  /** Bumped per request, so that opening one file twice is sent twice. */
  token: number;
};
