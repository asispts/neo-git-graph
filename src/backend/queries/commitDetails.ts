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
  while (lastLine >= 0 && lines[lastLine] === "") lastLine--;
  const commitInfo = lines[0].split(gitLogSeparator);
  return {
    hash: commitInfo[0],
    parents: commitInfo[1].split(" "),
    author: commitInfo[2],
    email: commitInfo[3],
    date: parseInt(commitInfo[4]),
    committer: commitInfo[5],
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
      const line = nameStatusLines[i].split("\t");
      if (line.length < 2) break;
      const oldFilePath = toPath(line[1]);
      const newFilePath = toPath(line[line.length - 1]);
      fileLookup[newFilePath] = details.fileChanges.length;
      details.fileChanges.push({
        oldFilePath,
        newFilePath,
        type: line[0][0] as GitFileChangeType,
        additions: null,
        deletions: null
      });
    }

    for (let i = 1; i < numStatLines.length - 1; i++) {
      const line = numStatLines[i].split("\t");
      if (line.length !== 3) break;
      const fileName = line[2].replace(/(.*){.* => (.*)}/, "$1$2").replace(/.* => (.*)/, "$1");
      if (typeof fileLookup[fileName] === "number") {
        details.fileChanges[fileLookup[fileName]].additions = parseInt(line[0]);
        details.fileChanges[fileLookup[fileName]].deletions = parseInt(line[1]);
      }
    }

    return { commitDetails: details };
  } catch {
    return { commitDetails: null };
  }
}
