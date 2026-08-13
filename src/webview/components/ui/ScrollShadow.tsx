const SHADOW_CLASS = [
  "pointer-events-none fixed inset-x-0 top-0 z-1 h-0",
  "shadow-[0_-6px_6px_6px_var(--vscode-scrollbar-shadow)]",
  "animate-scroll-shadow [animation-range:0_1px] [animation-timeline:scroll(root_block)]"
].join(" ");

/**
 * A shade along the top edge of the window, shown while the page is scrolled.
 * It marks the rows that sit above the edge. A scroll timeline drives it, so
 * no scroll listener runs and no re-render happens.
 */
export function ScrollShadow() {
  return <div class={SHADOW_CLASS} aria-hidden="true" />;
}
