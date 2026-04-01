import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
export function git(args: string[], cwd: string) {
  cp.execFileSync("git", args, { cwd, stdio: "pipe" });
}

export function makeRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ngg-test-"));
  try {
    git(["init", "-b", "main"], dir);
  } catch {
    git(["init"], dir);
    git(["checkout", "-b", "main"], dir);
  }
  git(["config", "user.email", "t@t.com"], dir);
  git(["config", "user.name", "T"], dir);
  git(["config", "commit.gpgsign", "false"], dir);
  git(["config", "tag.gpgsign", "false"], dir);
  fs.writeFileSync(path.join(dir, "f"), "x");
  git(["add", "."], dir);
  git(["commit", "-m", "init"], dir);
  return dir;
}
