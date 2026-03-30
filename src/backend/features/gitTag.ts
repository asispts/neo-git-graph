import type { GitInstance } from "./gitClient";

export type GitTag = ReturnType<typeof gitTagFactory>;

export function gitTagFactory(gitClient: GitInstance) {
  return {
    delete: async (tagName: string) => {
      try {
        await gitClient().tag(["-d", tagName]);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    push: async (tagName: string) => {
      try {
        await gitClient().push("origin", tagName);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    },

    add: async (tagName: string, commitHash: string, lightweight: boolean, message: string) => {
      try {
        const args: string[] = [];
        if (lightweight) {
          args.push(tagName);
        } else {
          args.push("-a", tagName, "-m", message);
        }
        args.push(commitHash);
        await gitClient().tag(args);
        return { error: false as const };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { error: true as const, message };
      }
    }
  };
}
