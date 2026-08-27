import { signal } from "@preact/signals";

import type { GitRepo } from "@/types";
import { rpc } from "@/webview/lib/rpc/rpc-client";

type RepoState =
  | { status: "loading" }
  | { status: "ready"; repos: Array<GitRepo> }
  | { status: "error"; message: string };

const state = signal<RepoState>({ status: "loading" });

export const repoStore = {
  get: (): RepoState => {
    return state.value;
  },
  fetch: async (): Promise<void> => {
    state.value = { status: "loading" };

    try {
      const result = await rpc.call("repo.scan", null);
      state.value = { status: "ready", repos: result.repos };
    } catch (error: unknown) {
      state.value = {
        status: "error",
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
};
