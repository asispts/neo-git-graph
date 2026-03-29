import type { GitInstance } from "./gitClient";

export type GitCommitFile = ReturnType<typeof gitCommitFileFactory>;

export function gitCommitFileFactory(gitClient: GitInstance) {
  return {
    get: async (repo: string, commitHash: string, filePath: string): Promise<string> => {
      try {
        return await gitClient().cwd(repo).show([`${commitHash}:${filePath}`]);
      } catch {
        return "";
      }
    }
  };
}
