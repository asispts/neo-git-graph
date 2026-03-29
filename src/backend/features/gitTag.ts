import type { GitInstance } from "./gitClient";

export type GitTag = ReturnType<typeof gitTagFactory>;

export function gitTagFactory(gitClient: GitInstance) {
  return {
    delete: async (tagName: string) => {
      try {
        const git = gitClient();
        await git.tag(["-d", tagName]);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    push: async (tagName: string) => {
      try {
        const git = gitClient();
        await git.push("origin", tagName);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    add: async (tagName: string, commitHash: string, lightweight: boolean, message: string) => {
      try {
        const git = gitClient();
        const args: string[] = [];
        if (lightweight) {
          args.push(tagName);
        } else {
          args.push("-a", tagName, "-m", message);
        }
        args.push(commitHash);
        await git.tag(args);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    }
  };
}
