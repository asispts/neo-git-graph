import * as cp from "node:child_process";

import { escapeRefName, getPathFromStr } from "./backend/utils";
import { getConfig } from "./config";
import { GitCommandStatus, GitCommitDetails, GitFileChangeType, GitResetMode } from "./types";

const eolRegex = /\r\n|\r|\n/g;
const gitLogSeparator = "XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb";

export class DataSource {
  private gitPath!: string;
  private gitExecPath!: string;
  private gitCommitDetailsFormat!: string;

  constructor() {
    this.registerGitPath();
    this.generateGitCommandFormats();
  }

  public registerGitPath() {
    this.gitPath = getConfig().gitPath();
    this.gitExecPath = this.gitPath.indexOf(" ") > -1 ? '"' + this.gitPath + '"' : this.gitPath;
  }

  public generateGitCommandFormats() {
    let dateType = getConfig().dateType() === "Author Date" ? "%at" : "%ct";
    this.gitCommitDetailsFormat =
      ["%H", "%P", "%an", "%ae", dateType, "%cn"].join(gitLogSeparator) + "%n%B";
  }

  public commitDetails(repo: string, commitHash: string) {
    return new Promise<GitCommitDetails | null>((resolve) => {
      Promise.all([
        new Promise<GitCommitDetails>((resolve, reject) =>
          this.execGit(
            "show --quiet " + commitHash + ' --format="' + this.gitCommitDetailsFormat + '"',
            repo,
            (err, stdout) => {
              if (err) {
                reject();
              } else {
                let lines = stdout.split(eolRegex);
                let lastLine = lines.length - 1;
                while (lines.length > 0 && lines[lastLine] === "") lastLine--;
                let commitInfo = lines[0].split(gitLogSeparator);
                resolve({
                  hash: commitInfo[0],
                  parents: commitInfo[1].split(" "),
                  author: commitInfo[2],
                  email: commitInfo[3],
                  date: parseInt(commitInfo[4]),
                  committer: commitInfo[5],
                  body: lines.slice(1, lastLine + 1).join("\n"),
                  fileChanges: []
                });
              }
            }
          )
        ),
        new Promise<string[]>((resolve, reject) =>
          this.execGit(
            "diff-tree --name-status -r -m --root --find-renames --diff-filter=AMDR " + commitHash,
            repo,
            (err, stdout) => {
              if (err) reject();
              else resolve(stdout.split(eolRegex));
            }
          )
        ),
        new Promise<string[]>((resolve, reject) =>
          this.execGit(
            "diff-tree --numstat -r -m --root --find-renames --diff-filter=AMDR " + commitHash,
            repo,
            (err, stdout) => {
              if (err) reject();
              else resolve(stdout.split(eolRegex));
            }
          )
        )
      ])
        .then((results) => {
          let details = results[0],
            fileLookup: { [file: string]: number } = {};

          for (let i = 1; i < results[1].length - 1; i++) {
            let line = results[1][i].split("\t");
            if (line.length < 2) break;
            let oldFilePath = getPathFromStr(line[1]),
              newFilePath = getPathFromStr(line[line.length - 1]);
            fileLookup[newFilePath] = details.fileChanges.length;
            details.fileChanges.push({
              oldFilePath: oldFilePath,
              newFilePath: newFilePath,
              type: <GitFileChangeType>line[0][0],
              additions: null,
              deletions: null
            });
          }

          for (let i = 1; i < results[2].length - 1; i++) {
            let line = results[2][i].split("\t");
            if (line.length !== 3) break;
            let fileName = line[2].replace(/(.*){.* => (.*)}/, "$1$2").replace(/.* => (.*)/, "$1");
            if (typeof fileLookup[fileName] === "number") {
              details.fileChanges[fileLookup[fileName]].additions = parseInt(line[0]);
              details.fileChanges[fileLookup[fileName]].deletions = parseInt(line[1]);
            }
          }
          resolve(details);
        })
        .catch(() => resolve(null));
    });
  }

  public getCommitFile(repo: string, commitHash: string, filePath: string) {
    return this.spawnGit(["show", commitHash + ":" + filePath], repo, (stdout) => stdout, "");
  }

  public async getRemoteUrl(repo: string) {
    return new Promise<string | null>((resolve) => {
      this.execGit("config --get remote.origin.url", repo, (err, stdout) => {
        resolve(!err ? stdout.split(eolRegex)[0] : null);
      });
    });
  }

  public isGitRepository(path: string) {
    return new Promise<boolean>((resolve) => {
      this.execGit("rev-parse --git-dir", path, (err) => {
        resolve(!err);
      });
    });
  }

  public checkoutCommit(repo: string, commitHash: string) {
    return this.runGitCommand("checkout " + commitHash, repo);
  }

  public mergeBranch(repo: string, branchName: string, createNewCommit: boolean) {
    return this.runGitCommand(
      "merge " + escapeRefName(branchName) + (createNewCommit ? " --no-ff" : ""),
      repo
    );
  }

  public mergeCommit(repo: string, commitHash: string, createNewCommit: boolean) {
    return this.runGitCommand("merge " + commitHash + (createNewCommit ? " --no-ff" : ""), repo);
  }

  public cherrypickCommit(repo: string, commitHash: string, parentIndex: number) {
    return this.runGitCommand(
      "cherry-pick " + commitHash + (parentIndex > 0 ? " -m " + parentIndex : ""),
      repo
    );
  }

  public revertCommit(repo: string, commitHash: string, parentIndex: number) {
    return this.runGitCommand(
      "revert --no-edit " + commitHash + (parentIndex > 0 ? " -m " + parentIndex : ""),
      repo
    );
  }

  public resetToCommit(repo: string, commitHash: string, resetMode: GitResetMode) {
    return this.runGitCommand("reset --" + resetMode + " " + commitHash, repo);
  }

  private runGitCommand(command: string, repo: string) {
    return new Promise<GitCommandStatus>((resolve) => {
      this.execGit(command, repo, (err, stdout, stderr) => {
        if (!err) {
          resolve(null);
        } else {
          let lines;
          if (stdout !== "" || stderr !== "") {
            lines = (stdout !== "" ? stdout : stderr !== "" ? stderr : "").split(eolRegex);
          } else {
            lines = err.message.split(eolRegex);
            lines.shift();
          }
          resolve(lines.slice(0, lines.length - 1).join("\n"));
        }
      });
    });
  }

  private execGit(
    command: string,
    repo: string,
    callback: { (error: Error | null, stdout: string, stderr: string): void }
  ) {
    cp.exec(this.gitExecPath + " " + command, { cwd: repo }, callback);
  }

  private spawnGit<T>(
    args: string[],
    repo: string,
    successValue: { (stdout: string): T },
    errorValue: T
  ) {
    return new Promise<T>((resolve) => {
      let stdout = "",
        err = false;
      const cmd = cp.spawn(this.gitPath, args, { cwd: repo });
      cmd.stdout.on("data", (d) => {
        stdout += d;
      });
      cmd.on("error", () => {
        resolve(errorValue);
        err = true;
      });
      cmd.on("exit", (code) => {
        if (err) return;
        resolve(code === 0 ? successValue(stdout) : errorValue);
      });
    });
  }
}
