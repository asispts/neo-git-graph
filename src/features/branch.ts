import * as cp from "node:child_process";

const eolRegex = /\r\n|\r|\n/g;
const headRegex = /^\(HEAD detached at [0-9A-Za-z]+\)/g;

export function getBranches(repoPath: string, gitPath: string, showRemoteBranches: boolean) {
  return new Promise<{ branches: string[]; head: string | null; error: boolean }>((resolve) => {
    const args = ["branch", ...(showRemoteBranches ? ["-a"] : [])];
    cp.execFile(gitPath, args, { cwd: repoPath }, (err, stdout) => {
      if (err) return resolve({ branches: [], head: null, error: true });
      const lines = stdout.split(eolRegex);
      const result = { branches: [] as string[], head: null as string | null, error: false };
      for (let i = 0; i < lines.length - 1; i++) {
        const name = lines[i].substring(2).split(" -> ")[0];
        if (name.match(headRegex)) continue;
        if (lines[i][0] === "*") {
          result.head = name;
          result.branches.unshift(name);
        } else {
          result.branches.push(name);
        }
      }
      resolve(result);
    });
  });
}
