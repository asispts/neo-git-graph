export function LoadingPage() {
  return (
    <main class="grid min-h-screen place-items-center px-6 py-16">
      <div class="text-center" role="status" aria-live="polite">
        <div class="relative mx-auto mb-6 grid size-20 place-items-center">
          <div class="absolute inset-0 animate-spin rounded-full border-2 border-line-soft border-t-focus motion-reduce:animate-none" />
          <svg
            class="size-10 text-muted"
            viewBox="0 0 40 40"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 11v16a7 7 0 0 0 7 7h9" />
            <path d="M12 19h7a9 9 0 0 0 9-9" />
            <circle cx="12" cy="8" r="3" class="fill-focus stroke-focus" />
            <circle cx="28" cy="7" r="3" class="fill-editor stroke-fg" />
            <circle cx="31" cy="34" r="3" class="fill-editor stroke-fg" />
          </svg>
        </div>
        <h1 class="text-ui font-medium text-fg">{window.l10n.loading}</h1>
        <div class="mx-auto mt-3 h-px w-12 overflow-hidden bg-line-soft" aria-hidden="true">
          <div class="h-full w-1/2 animate-pulse bg-focus motion-reduce:animate-none" />
        </div>
      </div>
    </main>
  );
}
