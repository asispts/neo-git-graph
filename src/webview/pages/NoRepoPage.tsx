import { useState } from "preact/hooks";

import { Button } from "@/webview/components/ui/Button";
import { Icon } from "@/webview/components/ui/Icons";
import { rpc } from "@/webview/lib/rpc/rpc-client";

export function NoRepoPage() {
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string>();

  const initializeRepo = async () => {
    setInitializing(true);
    setError(undefined);

    try {
      await rpc.call("git.init", null);
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(window.l10n.unableToInitializeRepo.replace("{0}", message));
    } finally {
      setInitializing(false);
    }
  };

  return (
    <main class="grid min-h-screen place-items-center px-6 py-16">
      <section class="w-full max-w-lg text-center" aria-labelledby="no-repo-title">
        <div class="mx-auto mb-6 grid size-28 place-items-center rounded-full border border-line-soft bg-btn">
          <svg
            class="size-20 text-muted"
            viewBox="0 0 80 80"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M12 24h22l6 7h28v31H12z" fill="var(--color-editor)" />
            <path d="M27 47h24" stroke="var(--color-focus)" />
            <circle cx="25" cy="47" r="4" fill="var(--color-editor)" />
            <circle cx="55" cy="47" r="4" fill="var(--color-editor)" />
            <path d="M40 47v10" stroke="var(--color-focus)" />
            <circle cx="40" cy="61" r="4" fill="var(--color-editor)" />
          </svg>
        </div>

        <h1 id="no-repo-title" class="text-xl font-semibold">
          {window.l10n.noRepo}
        </h1>

        <div class="mt-6">
          <Button variant="primary" disabled={initializing} onClick={() => void initializeRepo()}>
            <Icon>
              <path
                d="M2.5 3.5h4l1.5 2h5.5v7h-11v-9Zm5.5 4v3M6.5 9h3"
                fill="none"
                stroke="currentColor"
              />
            </Icon>
            {window.l10n.initializeRepo}
          </Button>
        </div>

        {error && (
          <p class="mt-5 text-git-deleted" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
