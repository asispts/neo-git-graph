import type { SimpleGit } from "simple-git";

import type { DateType, GitCommitDetails, GitFileChangeType, QueryResult } from "@/backend/types";

const eolRegex = /\r\n|\r|\n/g;
const gitLogSeparator = "XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb";

type CommitDetailsInput = {
  commitHash: string;
  dateType: DateType;
};

function toPath(str: string) {
  return str.replace(/\\/g, "/");
}

async function fetchCommitInfo(
  git: SimpleGit,
  commitHash: string,
  dateType: DateType
): Promise<GitCommitDetails> {
  const dateField = dateType === "Author Date" ? "%at" : "%ct";
  const format = ["%H", "%P", "%an", "%ae", dateField, "%cn"].join(gitLogSeparator) + "%n%B";
  const stdout = await git.raw(["show", "--quiet", commitHash, `--format=${format}`]);
  const lines = stdout.split(eolRegex);
  let lastLine = lines.length - 1;
  while (lastLine >= 0 && lines[lastLine] === "") {
    lastLine--;
  }
  const [hash, parents, author, email, date, committer] = lines[0].split(gitLogSeparator);
  if (
    hash === undefined ||
    parents === undefined ||
    author === undefined ||
    email === undefined ||
    date === undefined ||
    committer === undefined
  ) {
    throw new Error("Invalid commit information returned by Git");
  }
  return {
    hash,
    parents: parents.split(" "),
    author,
    email,
    date: parseInt(date),
    committer,
    body: lines.slice(1, lastLine + 1).join("\n"),
    fileChanges: []
  };
}

async function fetchNameStatus(git: SimpleGit, commitHash: string): Promise<string[]> {
  const stdout = await git.raw([
    "diff-tree",
    "--name-status",
    "-r",
    "-m",
    "--root",
    "--find-renames",
    "--diff-filter=AMDR",
    commitHash
  ]);
  return stdout.split(eolRegex);
}

async function fetchNumStat(git: SimpleGit, commitHash: string): Promise<string[]> {
  const stdout = await git.raw([
    "diff-tree",
    "--numstat",
    "-r",
    "-m",
    "--root",
    "--find-renames",
    "--diff-filter=AMDR",
    commitHash
  ]);
  return stdout.split(eolRegex);
}

export async function commitDetails(
  git: SimpleGit,
  input: CommitDetailsInput
): Promise<QueryResult<"commitDetails">> {
  try {
    const [details, nameStatusLines, numStatLines] = await Promise.all([
      fetchCommitInfo(git, input.commitHash, input.dateType),
      fetchNameStatus(git, input.commitHash),
      fetchNumStat(git, input.commitHash)
    ]);

    const fileLookup: { [file: string]: number } = {};
    for (let i = 1; i < nameStatusLines.length - 1; i++) {
      const [status, oldPath, ...newPaths] = nameStatusLines[i].split("\t");
      const type = status?.[0];
      if (type === undefined || oldPath === undefined) {
        break;
      }
      const oldFilePath = toPath(oldPath);
      const newFilePath = toPath(newPaths.at(-1) ?? oldPath);
      fileLookup[newFilePath] = details.fileChanges.length;
      details.fileChanges.push({
        oldFilePath,
        newFilePath,
        type: type as GitFileChangeType,
        additions: null,
        deletions: null
      });
    }

    for (let i = 1; i < numStatLines.length - 1; i++) {
      const [additions, deletions, path, ...extraFields] = numStatLines[i].split("\t");
      if (
        additions === undefined ||
        deletions === undefined ||
        path === undefined ||
        extraFields.length > 0
      ) {
        break;
      }
      const fileName = path.replace(/(.*){.* => (.*)}/, "$1$2").replace(/.* => (.*)/, "$1");
      const fileChange = details.fileChanges[fileLookup[fileName] ?? -1];
      if (fileChange !== undefined) {
        fileChange.additions = parseInt(additions);
        fileChange.deletions = parseInt(deletions);
      }
    }

    return { commitDetails: details };
  } catch {
    return { commitDetails: null };
  }
}
