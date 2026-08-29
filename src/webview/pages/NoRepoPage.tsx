import { useState } from "preact/hooks";

import { Button } from "@/webview/components/ui/Button";
import { Icon } from "@/webview/components/ui/Icons";
import { rpc } from "@/webview/lib/rpc/rpc-client";

export function NoRepoPage({ onRescan }: { onRescan: () => void }) {
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string>();

  const initializeRepo = async () => {
    setInitializing(true);
    setError(undefined);

    try {
      await rpc.call("git.init", null);
      onRescan();
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(window.l10n.unableToInitializeRepo.replace("{0}", message));
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

        <h1 id="no-repo-title" class="mb-2 text-xl font-semibold">
          {window.l10n.noRepo}
        </h1>
        <p class="mx-auto max-w-md text-muted">{window.l10n.noRepoDescription}</p>

        <div class="mt-6 flex flex-wrap justify-center gap-3">
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
          <Button disabled={initializing} onClick={onRescan}>
            <Icon>
              <path d="M3 8a5 5 0 0 1 9-3h-2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-1 0V3A6 6 0 1 0 14 8.5a.5.5 0 0 0-1-.1A5 5 0 1 1 3 8Z" />
            </Icon>
            {window.l10n.scanAgain}
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
