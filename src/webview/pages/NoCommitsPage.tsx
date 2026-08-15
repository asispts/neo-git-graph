export function NoCommitsPage() {
  return (
    <main class="grid min-h-96 place-items-center px-6 py-16">
      <div class="max-w-md text-center">
        <svg
          class="mx-auto mb-5 size-20 text-muted"
          viewBox="0 0 72 72"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M24 17v27a14 14 0 0 0 14 14h9" />
          <path d="M24 31h12a13 13 0 0 0 13-13v-1" />
          <circle cx="24" cy="12" r="5" fill="var(--color-editor)" />
          <circle cx="49" cy="12" r="5" fill="var(--color-editor)" />
          <circle cx="52" cy="58" r="5" fill="var(--color-editor)" />
        </svg>
        <h1 class="mb-2 text-xl font-semibold">{window.l10n.noCommits}</h1>
        <p class="text-muted">{window.l10n.createFirstCommit}</p>
      </div>
    </main>
  );
}
