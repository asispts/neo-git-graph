type LoadingProps = {
  class?: string;
  variant?: "inline" | "page";
};

export function Loading({ class: className, variant = "inline" }: LoadingProps) {
  const page = variant === "page";

  return (
    <div
      class={`${
        page ? "text-center" : "flex items-center justify-center gap-3 py-4"
      } ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <div
        class={`relative grid shrink-0 place-items-center ${page ? "mx-auto mb-6 size-20" : "size-8"}`}
      >
        <div class="absolute inset-0 animate-spin rounded-full border-2 border-line-soft border-t-focus motion-reduce:animate-none" />
        <svg
          class={`${page ? "size-10" : "size-4"} text-muted`}
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
      {page ? (
        <h1 class="text-ui font-medium text-fg">Loading ...</h1>
      ) : (
        <span class="text-ui font-medium text-fg">Loading ...</span>
      )}
      {page && (
        <div class="mx-auto mt-3 h-px w-12 overflow-hidden bg-line-soft" aria-hidden="true">
          <div class="h-full w-1/2 animate-pulse bg-focus motion-reduce:animate-none" />
        </div>
      )}
    </div>
  );
}
