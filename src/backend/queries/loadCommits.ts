import type { SimpleGit } from "simple-git";

import type {
  DateType,
  GitCommitNode,
  GitLogEntry,
  GitRefData,
  QueryResult
} from "@/backend/types";

const eolRegex = /\r\n|\r|\n/g;
const gitLogSeparator = "XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb";

type LoadCommitsInput = {
  branchName: string;
  maxCommits: number;
  showRemoteBranches: boolean;
  hard: boolean;
  dateType: DateType;
  showUncommittedChanges: boolean;
};

async function getRefs(git: SimpleGit, showRemoteBranches: boolean): Promise<GitRefData> {
  try {
    const args = ["show-ref"];
    if (!showRemoteBranches) {
      args.push("--heads", "--tags");
    }
    args.push("-d", "--head");
    const stdout = await git.raw(args);
    const refData: GitRefData = { head: null, refs: [] };
    const lines = stdout.split(eolRegex);
    for (const line of lines.slice(0, -1)) {
      const parts = line.split(" ");
      if (parts.length < 2) {
        continue;
      }
      const hash = parts.shift()!;
      const ref = parts.join(" ");
      if (ref.startsWith("refs/heads/")) {
        refData.refs.push({ hash, name: ref.substring(11), type: "head" });
      } else if (ref.startsWith("refs/tags/")) {
        refData.refs.push({
          hash,
          name: ref.endsWith("^{}") ? ref.substring(10, ref.length - 3) : ref.substring(10),
          type: "tag"
        });
      } else if (ref.startsWith("refs/remotes/")) {
        refData.refs.push({ hash, name: ref.substring(13), type: "remote" });
      } else if (ref === "HEAD") {
        refData.head = hash;
      }
    }
    return refData;
  } catch {
    return { head: null, refs: [] };
  }
}

async function getLog(
  git: SimpleGit,
  branch: string,
  maxCommits: number,
  showRemoteBranches: boolean,
  dateType: DateType
): Promise<GitLogEntry[]> {
  const dateField = dateType === "Author Date" ? "%at" : "%ct";
  const format = ["%H", "%P", "%an", "%ae", dateField, "%s"].join(gitLogSeparator);
  const args = ["log", `--max-count=${maxCommits}`, `--format=${format}`, "--date-order"];
  if (branch !== "") {
    args.push(branch);
  } else {
    args.push("--branches", "--tags");
    if (showRemoteBranches) {
      args.push("--remotes");
    }
  }
  try {
    const stdout = await git.raw(args);
    const lines = stdout.split(eolRegex);
    const commits: GitLogEntry[] = [];
    for (const line of lines.slice(0, -1)) {
      const [hash, parents, author, email, date, message, ...extraFields] =
        line.split(gitLogSeparator);
      if (
        hash === undefined ||
        parents === undefined ||
        author === undefined ||
        email === undefined ||
        date === undefined ||
        message === undefined ||
        extraFields.length > 0
      ) {
        break;
      }
      commits.push({
        hash,
        parentHashes: parents.split(" "),
        author,
        email,
        date: parseInt(date),
        message
      });
    }
    return commits;
  } catch {
    return [];
  }
}

async function countUnsavedChanges(git: SimpleGit) {
  try {
    const status = await git.status();
    return status.files.length;
  } catch {
    return 0;
  }
}

/** `repo` and `branchName` are echoed back by the message layer, not by the query. */
type LoadCommitsResult = Omit<QueryResult<"loadCommits">, "repo" | "branchName">;

export async function loadCommits(
  git: SimpleGit,
  input: LoadCommitsInput
): Promise<LoadCommitsResult> {
  const { branchName, maxCommits, showRemoteBranches, hard, dateType, showUncommittedChanges } =
    input;

  const [rawCommits, refData] = await Promise.all([
    getLog(git, branchName, maxCommits + 1, showRemoteBranches, dateType),
    getRefs(git, showRemoteBranches)
  ]);

  let commits = rawCommits;
  const moreCommitsAvailable = commits.length === maxCommits + 1;
  if (moreCommitsAvailable) {
    commits = commits.slice(0, -1);
  }

  let uncommittedChanges = 0;
  if (refData.head !== null && showUncommittedChanges) {
    for (const commit of commits) {
      if (refData.head === commit.hash) {
        uncommittedChanges = await countUnsavedChanges(git);
        if (uncommittedChanges > 0) {
          // The webview names this row, so that the name is localized.
          commits.unshift({
            hash: "*",
            parentHashes: [refData.head],
            author: "*",
            email: "",
            date: Math.round(new Date().getTime() / 1000),
            message: ""
          });
        }
        break;
      }
    }
  }

  const commitNodes: GitCommitNode[] = [];
  const commitLookup: { [hash: string]: number } = {};
  for (const [i, commit] of commits.entries()) {
    commitLookup[commit.hash] = i;
    commitNodes.push({
      hash: commit.hash,
      parentHashes: commit.parentHashes,
      author: commit.author,
      email: commit.email,
      date: commit.date,
      message: commit.message,
      refs: []
    });
  }
  for (const ref of refData.refs) {
    const commitIndex = commitLookup[ref.hash];
    if (commitIndex !== undefined) {
      commitNodes[commitIndex]?.refs.push(ref);
    }
  }

  return {
    commits: commitNodes,
    head: refData.head,
    moreCommitsAvailable,
    hard,
    uncommittedChanges
  };
}
