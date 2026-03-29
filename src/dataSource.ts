import * as cp from "node:child_process";

import { escapeRefName } from "./backend/utils";
import { getConfig } from "./config";
import { GitCommandStatus, GitResetMode } from "./types";

const eolRegex = /\r\n|\r|\n/g;

export class DataSource {
  private gitPath!: string;
  private gitExecPath!: string;

  constructor() {
    this.registerGitPath();
  }

  public registerGitPath() {
    this.gitPath = getConfig().gitPath();
    this.gitExecPath = this.gitPath.indexOf(" ") > -1 ? '"' + this.gitPath + '"' : this.gitPath;
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
