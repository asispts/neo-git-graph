import { signal } from "@preact/signals";

import type { GitRepo } from "@/types";
import { rpc } from "@/webview/lib/rpc/rpc-client";

const repoList = signal<Array<GitRepo> | undefined>(undefined);

export const repoListStore = {
  get: (): Array<GitRepo> | undefined => {
    return repoList.value;
  },
  load: async (): Promise<Array<GitRepo>> => {
    repoList.value = undefined;
    const result = await rpc.call("repo.scan", null);
    repoList.value = result.repos;
    return result.repos;
  }
};
