import { signal } from "@preact/signals";

import type { RepositoryState } from "@/webview/types/repo";

export const repoState = signal<RepositoryState>({ status: "loading" });
