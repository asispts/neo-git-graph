import { signal } from "@preact/signals";

import { repoListStore } from "@/webview/lib/stores/repo-list.store";

export const repoListError = signal<string | undefined>(undefined);

export async function loadRepoList(): Promise<void> {
  repoListError.value = undefined;

  try {
    await repoListStore.load();
  } catch (error: unknown) {
    repoListError.value = error instanceof Error ? error.message : String(error);
  }
}
