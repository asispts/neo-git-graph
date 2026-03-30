/* Git Data Model Types */

export interface GitRef {
  hash: string;
  name: string;
  type: "head" | "tag" | "remote";
}

export interface GitRefData {
  head: string | null;
  refs: GitRef[];
}

export interface GitCommitNode {
  hash: string;
  parentHashes: string[];
  author: string;
  email: string;
  date: number;
  message: string;
  refs: GitRef[];
}

export interface GitLogEntry {
  hash: string;
  parentHashes: string[];
  author: string;
  email: string;
  date: number;
  message: string;
}

export interface GitFileChange {
  oldFilePath: string;
  newFilePath: string;
  type: GitFileChangeType;
  additions: number | null;
  deletions: number | null;
}

export interface GitCommitDetails {
  hash: string;
  parents: string[];
  author: string;
  email: string;
  date: number;
  committer: string;
  body: string;
  fileChanges: GitFileChange[];
}

export type GitFileChangeType = "A" | "M" | "D" | "R";
export type DateType = "Author Date" | "Commit Date";
export type GitResetMode = "soft" | "mixed" | "hard";
